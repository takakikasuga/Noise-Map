#!/usr/bin/env python3
"""
lat が NULL の town_crimes レコードを GSI ジオコーディングで補完。

1. 親→子 union: Shapefile に子丁目がある場合はポリゴンを union
2. GSI 住所検索: 住所文字列から座標を取得

出力: town_crimes テーブルの lat, lng を UPDATE
"""

import argparse
import logging
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.crime_parser import load_boundaries, _find_parent_union
from lib.geo_utils import forward_geocode_gsi
from lib.supabase_client import get_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
DEFAULT_SHP = str(DATA_DIR / "administrative_area" / "tokyo" / "r2ka13.shp")

PAGE_SIZE = 1000


def fetch_null_centroid_areas() -> list[dict]:
    """lat が NULL の town_crimes レコードを取得（各 area_name につき1行のみ）"""
    client = get_client()
    rows: list[dict] = []
    offset = 0
    while True:
        page = (
            client.table("town_crimes")
            .select("id,area_name,municipality_name,year")
            .is_("lat", "null")
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        batch = page.data or []
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def main(args):
    logger.info("開始: NULL lat エリアのジオコーディング")

    # 1. NULL lat レコード取得
    rows = fetch_null_centroid_areas()
    logger.info("NULL lat レコード: %d 件", len(rows))
    if not rows:
        logger.info("処理対象なし")
        return

    # 2. Shapefile 読み込み
    boundaries = load_boundaries(args.shp_path)

    # 3. ユニーク area_name ごとに処理（同じエリアが複数年にある）
    unique_areas: dict[str, dict] = {}
    for r in rows:
        if r["area_name"] not in unique_areas:
            unique_areas[r["area_name"]] = {
                "municipality_name": r["municipality_name"],
            }

    logger.info("ユニーク NULL エリア: %d 件", len(unique_areas))

    # 4. ジオコーディング
    geocoded: dict[str, tuple[float, float]] = {}
    parent_union_count = 0
    gsi_count = 0
    skip_count = 0

    for area_name, info in unique_areas.items():
        muni = info["municipality_name"]

        # 特殊エントリをスキップ
        if "以下不詳" in area_name or "公園" in area_name[len(muni):]:
            skip_count += 1
            continue

        # 4a. 親→子 union
        geo = _find_parent_union(area_name, muni, boundaries)
        if geo:
            # centroid_wkt から lat/lng を抽出
            wkt = geo["centroid_wkt"]  # "POINT(lng lat)"
            parts = wkt.replace("POINT(", "").replace(")", "").split()
            lng, lat = float(parts[0]), float(parts[1])
            geocoded[area_name] = (lat, lng)
            parent_union_count += 1
            continue

        # 4b. GSI 順ジオコーディング
        address = f"東京都{area_name}"
        result = forward_geocode_gsi(address)
        if result:
            geocoded[area_name] = result
            gsi_count += 1
        else:
            skip_count += 1

        # レート制限（GSI API は寛容だが念のため）
        time.sleep(0.1)

        if (parent_union_count + gsi_count + skip_count) % 50 == 0:
            logger.info(
                "  進捗: 親union=%d, GSI=%d, スキップ=%d",
                parent_union_count, gsi_count, skip_count,
            )

    logger.info(
        "ジオコーディング完了: 親union=%d, GSI=%d, スキップ=%d",
        parent_union_count, gsi_count, skip_count,
    )

    if args.dry_run:
        logger.info("[DRY RUN] %d 件の更新をスキップ", len(geocoded))
        for area, (lat, lng) in list(geocoded.items())[:10]:
            logger.info("  %s → (%.6f, %.6f)", area, lat, lng)
        return

    # 5. DB 更新（area_name で一括更新）
    client = get_client()
    updated = 0
    for area_name, (lat, lng) in geocoded.items():
        # 同じ area_name の全年分を更新
        client.table("town_crimes").update({
            "lat": lat,
            "lng": lng,
        }).eq("area_name", area_name).execute()
        updated += 1

        if updated % 50 == 0:
            logger.info("  DB更新進捗: %d / %d", updated, len(geocoded))

    logger.info("完了: %d エリア（全年分）を更新", updated)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shp-path", type=str, default=DEFAULT_SHP)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    main(args)
