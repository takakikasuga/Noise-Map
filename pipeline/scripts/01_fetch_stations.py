#!/usr/bin/env python3
"""
駅マスタ取得。

国土数値情報の駅データ（GeoJSON）をパースし、
東京都の全駅を Supabase の stations テーブルに UPSERT する。

データソース: 国土数値情報「鉄道データ（N02）」
出力テーブル: stations
更新頻度: 年次
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.geo_utils import (
    batch_reverse_geocode,
    ensure_unique_slugs,
    parse_station_geojson,
)
from lib.supabase_client import upsert_records

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

DEFAULT_GEOJSON = str(
    Path(__file__).resolve().parent.parent
    / "data"
    / "raw"
    / "transportation"
    / "N02-22_GML"
    / "UTF-8"
    / "N02-22_Station.geojson"
)


def main(args):
    """メイン処理"""
    logger.info("開始: 駅マスタ取得")

    # 1. GeoJSON パース → 東京バウンディングボックスで粗くフィルタ
    stations = parse_station_geojson(args.geojson_path)
    logger.info("Step 1 完了: %d 駅候補を抽出", len(stations))

    if args.limit:
        stations = stations[: args.limit]
        logger.info("--limit %d: 先頭 %d 件に制限", args.limit, len(stations))

    # 2. 逆ジオコーディング → 市区町村コード付与 + 東京都のみに絞り込み
    if args.skip_geocode:
        logger.info("逆ジオコーディングをスキップ (--skip-geocode)")
        for s in stations:
            s["municipality_code"] = "13000"
            s["municipality_name"] = "未取得"
    else:
        stations = batch_reverse_geocode(stations)
    logger.info("Step 2 完了: %d 駅（東京都）", len(stations))

    # 3. ローマ字スラッグ生成 + 一意性保証
    stations = ensure_unique_slugs(stations)
    logger.info("Step 3 完了: name_en 生成済み")

    # 4. Supabase 用レコード組み立て
    records = []
    for s in stations:
        records.append(
            {
                "name": s["name"],
                "name_en": s["name_en"],
                "location": f"POINT({s['lng']} {s['lat']})",
                "municipality_code": s["municipality_code"],
                "municipality_name": s["municipality_name"],
                "lines": s["lines"],
            }
        )

    # 5. DB 書き込み or プレビュー
    if args.dry_run:
        logger.info("[DRY RUN] %d 駅（先頭 20 件を表示）:", len(records))
        for r in records[:20]:
            logger.info(
                "  %s (%s) | %s | %s | %s",
                r["name"],
                r["name_en"],
                r["municipality_name"],
                r["location"],
                ", ".join(r["lines"]),
            )
        if len(records) > 20:
            logger.info("  ... 他 %d 駅", len(records) - 20)
    else:
        count = upsert_records("stations", records, on_conflict="name_en")
        logger.info("Supabase に %d 駅を登録しました", count)

    logger.info("完了: %d 件処理", len(records))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--geojson-path",
        type=str,
        default=DEFAULT_GEOJSON,
        help="駅データ GeoJSON ファイルのパス",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB に書き込まない",
    )
    parser.add_argument(
        "--skip-geocode",
        action="store_true",
        help="逆ジオコーディングをスキップ（高速プレビュー用）",
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
