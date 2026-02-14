"""
01_fetch_stations.py - 駅マスタ取得

国土数値情報の駅データ（GML）をパースし、
東京都の全駅をSupabase の stations テーブルに INSERT する。

データソース:
  - 国土数値情報「鉄道データ（N02）」
    https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_1.html

実行方法:
  python scripts/01_fetch_stations.py --gml-path data/N02-23_GML/N02-23_Station.gml
"""

import argparse
import logging
import sys

# プロジェクトルートをパスに追加
sys.path.insert(0, ".")

from lib.supabase_client import upsert_records
from lib.geo_utils import parse_gml_stations, find_municipality
from config.settings import TOKYO_PREFECTURE_CODE

logger = logging.getLogger(__name__)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="国土数値情報GMLから東京都の駅マスタを取得し、Supabaseに登録する"
    )
    parser.add_argument(
        "--gml-path",
        type=str,
        required=True,
        help="国土数値情報 駅データ GML ファイルのパス",
    )
    parser.add_argument(
        "--boundaries-path",
        type=str,
        default="data/boundaries/tokyo.geojson",
        help="行政区域ポリゴンのファイルパス",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB書き込みを行わずに処理結果を表示",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを出力",
    )
    args = parser.parse_args()

    # ログ設定
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    logger.info("=== 駅マスタ取得開始 ===")

    # 1. GML をパース
    stations_raw = parse_gml_stations(args.gml_path, TOKYO_PREFECTURE_CODE)
    logger.info("パース結果: %d 駅", len(stations_raw))

    # 2. 各駅に区市町村情報を付与
    stations = []
    for s in stations_raw:
        code, name = find_municipality(s["lat"], s["lng"], args.boundaries_path)
        stations.append({
            "name": s["name"],
            "name_en": s["name_en"],
            "location": f"POINT({s['lng']} {s['lat']})",
            "municipality_code": code,
            "municipality_name": name,
            "lines": s.get("lines", []),
        })

    # 3. Supabase に登録
    if args.dry_run:
        logger.info("[DRY RUN] %d 駅を表示:", len(stations))
        for s in stations[:10]:
            logger.info("  %s (%s)", s["name"], s["name_en"])
    else:
        count = upsert_records("stations", stations, on_conflict="name_en")
        logger.info("Supabase に %d 駅を登録しました", count)

    logger.info("=== 駅マスタ取得完了 ===")


if __name__ == "__main__":
    main()
