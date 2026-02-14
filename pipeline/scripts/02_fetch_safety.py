"""
02_fetch_safety.py - 治安データ取得

警視庁の犯罪統計データ（CSV/Excel）をパースし、
駅ごとの犯罪件数を集計して safety_scores テーブルに INSERT する。

データソース:
  - 警視庁「区市町村の町丁別、罪種別及び手口別認知件数」
    https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html

実行方法:
  python scripts/02_fetch_safety.py --data-path data/safety/crime_data.csv --year 2024
"""

import argparse
import logging
import sys

sys.path.insert(0, ".")

from lib.supabase_client import upsert_records, select_all
from lib.normalizer import calculate_safety_score
from config.settings import DATA_DIR

logger = logging.getLogger(__name__)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="警視庁犯罪データを取得・加工し、駅ごとの治安スコアを算出する"
    )
    parser.add_argument(
        "--data-path",
        type=str,
        required=True,
        help="犯罪データファイルのパス（CSV or Excel）",
    )
    parser.add_argument(
        "--year",
        type=int,
        required=True,
        help="対象年度",
    )
    parser.add_argument(
        "--month",
        type=int,
        default=None,
        help="対象月（省略時は年間データ）",
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

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    logger.info("=== 治安データ取得開始 (年度: %d) ===", args.year)

    # TODO: 以下の処理を実装
    # 1. CSV/Excel を pandas で読み込み
    # 2. 区市町村別・罪種別の件数を集計
    # 3. 全駅を取得し、各駅の所属区市町村の犯罪件数を紐付け
    # 4. normalize_score で全駅のスコアを計算
    # 5. safety_scores テーブルに UPSERT

    logger.info("=== 治安データ取得完了 ===")


if __name__ == "__main__":
    main()
