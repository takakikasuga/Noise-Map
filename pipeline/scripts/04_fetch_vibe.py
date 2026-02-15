#!/usr/bin/env python3
"""
雰囲気データ取得。

e-Stat API（国勢調査）と Overpass API（OpenStreetMap）を使用して、
各駅周辺の人口構成・施設数を取得し、タグを自動生成して
vibe_data テーブルに UPSERT する。

データソース: e-Stat API + Overpass API
出力テーブル: vibe_data
更新頻度: 年次
"""

import argparse
import logging
import re
import struct
import sys
from pathlib import Path
from typing import Optional, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.estat_client import fetch_all_estat_data
from lib.normalizer import generate_vibe_tags
from lib.overpass_client import fetch_all_stations_facilities
from lib.supabase_client import get_client, select_all, upsert_records
from config.settings import ESTAT_API_KEY, STATION_RADIUS_M

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def _parse_location(location) -> Optional[Tuple[float, float]]:
    """
    Supabase の GEOGRAPHY カラムから lat, lng を抽出。

    PostgREST は GEOGRAPHY を GeoJSON で返す場合と
    WKT 文字列で返す場合がある。両方に対応する。
    """
    if location is None:
        return None

    # GeoJSON 形式: {"type": "Point", "coordinates": [lng, lat]}
    if isinstance(location, dict):
        coords = location.get("coordinates")
        if coords and len(coords) >= 2:
            return coords[1], coords[0]

    if isinstance(location, str):
        # WKT 文字列: "POINT(lng lat)" or "SRID=4326;POINT(lng lat)"
        match = re.search(r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", location)
        if match:
            lng, lat = float(match.group(1)), float(match.group(2))
            return lat, lng

        # WKB hex: Supabase が GEOGRAPHY を返す標準形式
        # 例: "0101000020E6100000{lng_8bytes}{lat_8bytes}"
        if re.fullmatch(r"[0-9a-fA-F]+", location) and len(location) >= 50:
            try:
                raw = bytes.fromhex(location)
                # EWKB with SRID: byte_order(1) + type(4) + srid(4) + x(8) + y(8) = 25 bytes
                if len(raw) >= 25:
                    lng, lat = struct.unpack_from("<dd", raw, 9)
                    return lat, lng
            except (ValueError, struct.error):
                pass

    return None


def main(args):
    """メイン処理"""
    logger.info("=== 雰囲気データ取得開始 ===")

    # 1. stations テーブルから全駅を取得
    logger.info("Step 1: 駅データ取得中...")
    if args.station_id:
        client = get_client()
        result = (
            client.table("stations")
            .select("id,name,name_en,municipality_code,location")
            .eq("id", args.station_id)
            .execute()
        )
        stations = result.data or []
    else:
        stations = select_all(
            "stations", "id,name,name_en,municipality_code,location"
        )

    if not stations:
        logger.error("駅データが見つかりません")
        return

    if args.limit:
        stations = stations[: args.limit]

    logger.info("対象駅数: %d", len(stations))

    # 2. e-Stat API で人口構成データを取得（市区町村単位）
    estat_data: dict[str, dict] = {}
    if not args.skip_estat:
        logger.info("Step 2: e-Stat API データ取得中...")
        estat_data = fetch_all_estat_data(ESTAT_API_KEY)
        logger.info("e-Stat データ: %d 市区町村", len(estat_data))
    else:
        logger.info("Step 2: e-Stat API スキップ (--skip-estat)")

    # 3. 位置情報パース
    logger.info("Step 3: 位置情報パース中...")
    parsed_stations = []
    skipped = 0

    for station in stations:
        loc = _parse_location(station.get("location"))
        if loc is None:
            logger.warning(
                "位置情報なし: %s (%s) — スキップ",
                station["name"],
                station["id"],
            )
            skipped += 1
            continue
        lat, lng = loc
        parsed_stations.append({**station, "lat": lat, "lng": lng})

    logger.info("位置情報あり: %d 駅（スキップ: %d 駅）", len(parsed_stations), skipped)

    # 4. Overpass API で周辺施設数をバッチ取得
    if not args.skip_osm:
        logger.info("Step 4: Overpass API バッチ取得中...")
        all_facilities = fetch_all_stations_facilities(
            parsed_stations, args.radius
        )
    else:
        logger.info("Step 4: Overpass API スキップ (--skip-osm)")
        zero = {
            "restaurant_count": 0,
            "convenience_store_count": 0,
            "park_count": 0,
            "school_count": 0,
            "hospital_count": 0,
        }
        all_facilities = [zero for _ in parsed_stations]

    # 5. レコード組み立て
    logger.info("Step 5: レコード構築中...")
    records = []

    for i, station in enumerate(parsed_stations):
        muni_code = station.get("municipality_code", "")
        estat = estat_data.get(muni_code, {})

        young_ratio = estat.get("young_ratio", 0.0)
        family_ratio = estat.get("family_ratio", 0.0)
        elderly_ratio = estat.get("elderly_ratio", 0.0)
        daytime_ratio = estat.get("daytime_ratio", 1.0)
        single_ratio = estat.get("single_ratio", 0.0)

        facilities = all_facilities[i]

        tags = generate_vibe_tags(
            young_ratio=young_ratio,
            family_ratio=family_ratio,
            elderly_ratio=elderly_ratio,
            daytime_ratio=daytime_ratio,
            single_ratio=single_ratio,
            restaurant_count=facilities["restaurant_count"],
            park_count=facilities["park_count"],
        )

        records.append({
            "station_id": station["id"],
            "population_young_ratio": young_ratio,
            "population_family_ratio": family_ratio,
            "population_elderly_ratio": elderly_ratio,
            "daytime_population_ratio": daytime_ratio,
            "single_household_ratio": single_ratio,
            "restaurant_count": facilities["restaurant_count"],
            "convenience_store_count": facilities["convenience_store_count"],
            "park_count": facilities["park_count"],
            "school_count": facilities["school_count"],
            "hospital_count": facilities["hospital_count"],
            "tags": tags,
        })

    logger.info(
        "レコード生成完了: %d 件（スキップ: %d 件）", len(records), skipped
    )

    # 6. DB 書き込み or プレビュー
    if args.dry_run:
        logger.info("[DRY RUN] %d 件（先頭 20 件を表示）:", len(records))
        for r in records[:20]:
            station = next(
                (s for s in parsed_stations if s["id"] == r["station_id"]), {}
            )
            logger.info(
                "  %s | 若年%.1f%% 家族%.1f%% 高齢%.1f%% | 昼夜比%.2f | 単身%.1f%% | "
                "飲食%d コンビニ%d 公園%d 学校%d 病院%d | %s",
                station.get("name", "?"),
                r["population_young_ratio"] * 100,
                r["population_family_ratio"] * 100,
                r["population_elderly_ratio"] * 100,
                r["daytime_population_ratio"],
                r["single_household_ratio"] * 100,
                r["restaurant_count"],
                r["convenience_store_count"],
                r["park_count"],
                r["school_count"],
                r["hospital_count"],
                ", ".join(r["tags"]) if r["tags"] else "（タグなし）",
            )
        if len(records) > 20:
            logger.info("  ... 他 %d 件", len(records) - 20)
    else:
        logger.info("Step 6: vibe_data テーブルに UPSERT 中...")
        count = upsert_records("vibe_data", records, on_conflict="station_id")
        logger.info("vibe_data: %d 件登録", count)

    logger.info("=== 雰囲気データ取得完了 ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--station-id",
        type=str,
        default=None,
        help="特定の駅IDのみ処理（省略時は全駅）",
    )
    parser.add_argument(
        "--radius",
        type=float,
        default=STATION_RADIUS_M,
        help=f"検索半径（メートル、デフォルト: {STATION_RADIUS_M}m）",
    )
    parser.add_argument(
        "--skip-estat",
        action="store_true",
        help="e-Stat API の呼び出しをスキップ",
    )
    parser.add_argument(
        "--skip-osm",
        action="store_true",
        help="Overpass API の呼び出しをスキップ",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB書き込みを行わずに処理結果を表示",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="処理件数制限（デバッグ用）",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを出力",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    main(args)
