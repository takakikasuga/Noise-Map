"""
05_calculate_scores.py - 全駅スコア再計算

全駅の各データソースからスコアを再計算し、
ランキングを更新する。

各パイプライン（02〜04）で個別にスコアを計算しているが、
このスクリプトで全駅の相対的なランキングを再計算する。

実行方法:
  python scripts/05_calculate_scores.py
"""

import argparse
import logging
import sys

sys.path.insert(0, ".")

from lib.supabase_client import select_all, upsert_records
from lib.normalizer import normalize_score

logger = logging.getLogger(__name__)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="全駅のスコアを再計算し、ランキングを更新する"
    )
    parser.add_argument(
        "--table",
        type=str,
        choices=["safety_scores", "hazard_data", "all"],
        default="all",
        help="再計算対象テーブル（デフォルト: all）",
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

    logger.info("=== スコア再計算開始 (対象: %s) ===", args.table)

    # TODO: 以下の処理を実装
    # 1. 対象テーブルの全レコードを取得
    # 2. normalize_score でスコアを再計算
    # 3. スコアの降順でランキングを付与
    # 4. テーブルを更新

    if args.table in ("safety_scores", "all"):
        logger.info("--- 治安スコア再計算 ---")
        # TODO: safety_scores の再計算

    if args.table in ("hazard_data", "all"):
        logger.info("--- 災害スコア再計算 ---")
        # TODO: hazard_data の再計算

    logger.info("=== スコア再計算完了 ===")


if __name__ == "__main__":
    main()
