"""
犯罪データパーサー
警視庁CSVのパース、町丁目名の正規化、境界Shapefileの読み込み
"""

import csv
import logging
import re
from pathlib import Path
from typing import Any, Optional

import geopandas as gpd
from shapely.geometry import mapping, shape
from shapely.ops import unary_union

from lib.geo_utils import TOKYO_MUNICIPALITIES

logger = logging.getLogger(__name__)

# 市区町村名の逆引き（名前→コード）
_MUNI_NAME_TO_CODE: dict[str, str] = {v: k for k, v in TOKYO_MUNICIPALITIES.items()}

# 全角数字→半角
_FULLWIDTH_MAP = str.maketrans("０１２３４５６７８９", "0123456789")

# 漢数字→算用数字
_KANJI_NUM = {"一": "1", "二": "2", "三": "3", "四": "4", "五": "5",
              "六": "6", "七": "7", "八": "8", "九": "9"}

# 集計行として除外するパターン
_SKIP_PATTERNS = re.compile(r"(計$|^合計|^総計|^海外|^不明)")

# CSV列インデックス
_COL = {
    "area": 0, "total": 1, "violent": 2, "assault": 5,
    "burglary": 11, "larceny": 20, "other": 32,
    "fraud": 33, "intellectual": 35,
}


def normalize_area_name(name: str) -> str:
    """
    町丁目名を正規化。

    - 全角数字→半角
    - 漢数字→算用数字（丁目の前のみ）
    - 郡名除去（"西多摩郡檜原村" → "檜原村"）
    - 大字除去（"日の出町大字平井" → "日の出町平井"）
    """
    # 全角数字
    name = name.translate(_FULLWIDTH_MAP)
    # 漢数字（丁目の前）
    name = re.sub(
        r"([一二三四五六七八九])丁目",
        lambda m: _KANJI_NUM[m.group(1)] + "丁目",
        name,
    )
    # 郡名除去
    name = re.sub(r"^.+?郡", "", name)
    # 大字除去
    name = name.replace("大字", "")
    return name


def extract_municipality(area_name: str) -> Optional[tuple[str, str]]:
    """
    正規化済みエリア名から市区町村コードと名前を抽出。
    TOKYO_MUNICIPALITIES の名前リストと先頭一致で判定。

    Returns:
        (code, name) or None
    """
    # 長い名前を先に試す（"あきる野市" が "市" だけの部分一致にならないよう）
    for name in sorted(_MUNI_NAME_TO_CODE.keys(), key=len, reverse=True):
        if area_name.startswith(name):
            return _MUNI_NAME_TO_CODE[name], name
    return None


def _detect_encoding(csv_path: str) -> str:
    """CSVファイルのエンコーディングを自動判定（utf-8 → cp932 フォールバック）"""
    for enc in ("utf-8", "cp932"):
        try:
            with open(csv_path, encoding=enc) as f:
                f.readline()
            return enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return "utf-8"


def parse_crime_csv(csv_path: str, year: int) -> list[dict[str, Any]]:
    """
    警視庁犯罪CSVをパースし、町丁目レベルのレコードリストを返す。
    集計行（市区町村単体、"〜計"）は除外する。
    R5/R6 は UTF-8、R7 は cp932 のためエンコーディングを自動判定する。
    """
    encoding = _detect_encoding(csv_path)
    logger.info("犯罪CSV パース中: %s (year=%d, encoding=%s)", csv_path, year, encoding)
    records = []
    skipped = 0

    with open(csv_path, encoding=encoding) as f:
        reader = csv.reader(f)
        header = next(reader)
        logger.info("CSV列数: %d, ヘッダー先頭: %s", len(header), header[0])

        for row in reader:
            raw_name = row[_COL["area"]]
            normalized = normalize_area_name(raw_name)

            # 集計行をスキップ
            if _SKIP_PATTERNS.search(normalized):
                skipped += 1
                continue

            # 市区町村抽出
            muni = extract_municipality(normalized)
            if muni is None:
                skipped += 1
                continue
            code, muni_name = muni

            # 市区町村名のみの行（合計行）をスキップ
            if normalized == muni_name:
                skipped += 1
                continue

            total = int(row[_COL["total"]] or 0)
            violent = int(row[_COL["violent"]] or 0)
            assault = int(row[_COL["assault"]] or 0)
            theft = int(row[_COL["burglary"]] or 0) + int(row[_COL["larceny"]] or 0)
            intellectual = int(row[_COL["fraud"]] or 0) + int(row[_COL["intellectual"]] or 0)
            other = total - violent - assault - theft - intellectual

            records.append({
                "area_name": normalized,
                "area_name_raw": raw_name,
                "municipality_code": code,
                "municipality_name": muni_name,
                "year": year,
                "total_crimes": total,
                "crimes_violent": violent,
                "crimes_assault": assault,
                "crimes_theft": theft,
                "crimes_intellectual": intellectual,
                "crimes_other": max(0, other),
            })

    logger.info("パース完了: %d 町丁目レコード（%d 行スキップ）", len(records), skipped)
    return records


def load_boundaries(shp_path: str) -> dict[str, dict[str, Any]]:
    """
    小地域境界 Shapefile を読み込み、正規化名をキーにした辞書を返す。

    Returns:
        {正規化エリア名: {"centroid_wkt": str, "boundary_wkt": str}}
    """
    logger.info("Shapefile 読み込み中: %s", shp_path)
    gdf = gpd.read_file(shp_path)

    # EPSG:4612 (JGD2000) → EPSG:4326 (WGS84) に変換
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    # 町丁目レベル（11桁KEY_CODE）のみ
    towns = gdf[gdf["KEY_CODE"].str.len() == 11].copy()
    towns = towns[towns["S_NAME"].notna()]

    boundaries: dict[str, dict[str, Any]] = {}
    for _, row in towns.iterrows():
        raw_name = f"{row['CITY_NAME']}{row['S_NAME']}"
        normalized = normalize_area_name(raw_name)
        geom = row["geometry"]

        if geom is None or geom.is_empty:
            continue

        centroid = geom.centroid
        # Polygon → MultiPolygon に統一
        if geom.geom_type == "Polygon":
            from shapely.geometry import MultiPolygon
            geom = MultiPolygon([geom])

        boundaries[normalized] = {
            "centroid_wkt": f"POINT({centroid.x} {centroid.y})",
            "boundary_wkt": geom.wkt,
        }

    logger.info("境界データ読み込み完了: %d ポリゴン", len(boundaries))
    return boundaries


def _find_parent_union(
    area_name: str,
    municipality_name: str,
    boundaries: dict[str, dict[str, Any]],
) -> Optional[dict[str, Any]]:
    """
    親エリア→子丁目の union フォールバック。

    例: CSV「昭島市福島町」→ Shapefile「昭島市福島町1丁目」「昭島市福島町2丁目」...
    子ポリゴンを全て union して centroid を返す。
    """
    area_part = area_name[len(municipality_name):]
    children = [
        k for k in boundaries
        if k.startswith(area_name) and k != area_name
    ]
    if not children:
        return None

    from shapely import wkt as shapely_wkt

    polys = []
    for child_key in children:
        child = boundaries[child_key]
        try:
            polys.append(shapely_wkt.loads(child["boundary_wkt"]))
        except Exception:
            continue

    if not polys:
        return None

    merged = unary_union(polys)
    centroid = merged.centroid
    return {
        "centroid_wkt": f"POINT({centroid.x} {centroid.y})",
        "boundary_wkt": merged.wkt,
    }


def attach_boundaries(
    records: list[dict[str, Any]],
    boundaries: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    犯罪レコードに境界ポリゴンとcentroidを付与。

    マッチング順序:
    1. 正規化名で完全一致
    2. 親エリア→子丁目の union フォールバック
    """
    matched_exact = 0
    matched_parent = 0

    for rec in records:
        # 1. 完全一致
        geo = boundaries.get(rec["area_name"])
        if geo:
            rec["centroid"] = geo["centroid_wkt"]
            rec["boundary"] = geo["boundary_wkt"]
            matched_exact += 1
            continue

        # 2. 親→子 union
        geo = _find_parent_union(
            rec["area_name"], rec["municipality_name"], boundaries
        )
        if geo:
            rec["centroid"] = geo["centroid_wkt"]
            rec["boundary"] = geo["boundary_wkt"]
            matched_parent += 1
            continue

        rec["centroid"] = None
        rec["boundary"] = None

    total = matched_exact + matched_parent
    rate = total / len(records) * 100 if records else 0
    logger.info(
        "ポリゴンマッチ: %d / %d (%.1f%%) [完全一致=%d, 親→子union=%d]",
        total, len(records), rate, matched_exact, matched_parent,
    )
    return records
