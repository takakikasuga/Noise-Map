"""
03_fetch_hazard.py - 災害リスクデータ取得

不動産情報ライブラリ API を使用して、
各駅周辺の洪水・土砂・津波・液状化リスク情報を取得し、
hazard_data テーブルに INSERT する。

データソース:
  - 不動産情報ライブラリ API
    https://www.reinfolib.mlit.go.jp/

実行方法:
  python scripts/03_fetch_hazard.py
"""

import argparse
import logging
import sys

sys.path.insert(0, ".")

from lib.supabase_client import upsert_records, select_all
from lib.normalizer import calculate_hazard_score
from config.settings import REINFOLIB_API_KEY, STATION_RADIUS_M

logger = logging.getLogger(__name__)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="不動産情報ライブラリAPIから駅ごとの災害リスクデータを取得・スコア化する"
    )
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

    logger.info("=== 災害リスクデータ取得開始 ===")

    # TODO: 以下の処理を実装
    # 1. stations テーブルから全駅を取得
    # 2. 各駅について不動産情報ライブラリ API をコール
    #    - 洪水浸水想定区域
    #    - 土砂災害警戒区域
    #    - 津波浸水想定区域
    #    - 液状化リスク
    # 3. calculate_hazard_score でスコアを算出
    # 4. hazard_data テーブルに UPSERT

    logger.info("=== 災害リスクデータ取得完了 ===")


if __name__ == "__main__":
    main()
