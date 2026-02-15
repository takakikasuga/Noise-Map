"""
丁目マスタ生成
Shapefile から areas テーブル用のレコードを生成する
"""

import json
import logging
from typing import Any

import geopandas as gpd
from shapely.geometry import MultiPolygon, mapping
from shapely.ops import unary_union

from lib.crime_parser import normalize_area_name
from lib.geo_utils import TOKYO_MUNICIPALITIES, romanize_station_name

logger = logging.getLogger(__name__)

# 市区町村コード→名前の逆引き用（Shapefile の CITY_NAME がない場合のフォールバック）
_CODE_TO_MUNI: dict[str, str] = TOKYO_MUNICIPALITIES


def load_areas_from_shapefile(shp_path: str) -> list[dict[str, Any]]:
    """
    Shapefile から丁目マスタレコードを生成。

    既存 crime_parser.load_boundaries() のロジックを再利用:
    - geopandas で shp 読み込み → CRS 変換
    - KEY_CODE 11桁でフィルタ
    - normalize_area_name() で正規化
    - centroid/boundary WKT 生成

    追加:
    - KEY_CODE を保持（e-Stat 小地域コードとのマッピングに使用）
    - KEY_CODE 先頭5桁 → municipality_code
    - CITY_NAME → municipality_name
    - lat/lng を centroid から抽出
    - romanize_station_name() で name_en 生成
    - GeoJSON 生成（フロントエンド用）

    Returns:
        [{area_name, area_name_en, municipality_code, municipality_name,
          key_code, lat, lng, centroid, boundary, geojson}, ...]
    """
    logger.info("Shapefile 読み込み中: %s", shp_path)
    gdf = gpd.read_file(shp_path)

    # EPSG:4612 (JGD2000) → EPSG:4326 (WGS84) に変換
    if gdf.crs and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    # 町丁目レベル（11桁KEY_CODE）のみ
    towns = gdf[gdf["KEY_CODE"].str.len() == 11].copy()
    towns = towns[towns["S_NAME"].notna()]

    # area_name ごとにジオメトリとメタデータを集約
    # （同一丁目が複数ポリゴンに分割されている場合があるため）
    area_groups: dict[str, dict[str, Any]] = {}
    skipped = 0

    for _, row in towns.iterrows():
        raw_name = f"{row['CITY_NAME']}{row['S_NAME']}"
        area_name = normalize_area_name(raw_name)
        geom = row["geometry"]

        if geom is None or geom.is_empty:
            skipped += 1
            continue

        key_code = row["KEY_CODE"]
        municipality_code = key_code[:5]
        municipality_name = row.get("CITY_NAME", "")
        if not municipality_name:
            municipality_name = _CODE_TO_MUNI.get(municipality_code, "")

        if area_name not in area_groups:
            area_groups[area_name] = {
                "geometries": [geom],
                "key_code": key_code,
                "municipality_code": municipality_code,
                "municipality_name": municipality_name,
            }
        else:
            area_groups[area_name]["geometries"].append(geom)

    merged = len(towns) - skipped - len(area_groups)
    if merged > 0:
        logger.info("ポリゴンマージ: %d フィーチャー → %d エリア", len(towns) - skipped, len(area_groups))

    records: list[dict[str, Any]] = []
    for area_name, group in area_groups.items():
        geom = unary_union(group["geometries"])

        # Polygon → MultiPolygon に統一
        if geom.geom_type == "Polygon":
            geom = MultiPolygon([geom])

        centroid = geom.centroid
        lat = round(centroid.y, 6)
        lng = round(centroid.x, 6)

        centroid_wkt = f"POINT({centroid.x} {centroid.y})"
        boundary_wkt = geom.wkt
        geojson_str = json.dumps(mapping(geom), ensure_ascii=False)

        area_name_en = romanize_station_name(area_name)

        records.append({
            "area_name": area_name,
            "area_name_en": area_name_en,
            "municipality_code": group["municipality_code"],
            "municipality_name": group["municipality_name"],
            "key_code": group["key_code"],
            "lat": lat,
            "lng": lng,
            "centroid": centroid_wkt,
            "boundary": boundary_wkt,
            "geojson": geojson_str,
        })

    logger.info(
        "丁目マスタ生成完了: %d レコード（%d スキップ）",
        len(records), skipped,
    )
    return records
