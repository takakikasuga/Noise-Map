#!/usr/bin/env python3
"""
ゴミデータ除去（ワンタイム）。

town_crimes テーブルから「以下不詳」「公園名」エントリを DELETE する。
既にパーサー側（crime_parser.py）にスキップロジックを追加済みのため、
これは既存データのクリーンアップ用スクリプト。

対象テーブル: town_crimes
更新頻度: ワンタイム
"""

import argparse
import logging
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.supabase_client import get_client, select_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# 「以下不詳」パターン
_FUZYO_PATTERN = re.compile(r"以下不詳")

# 公園パターン（丁目を含むものは除外しない）
_PARK_PATTERN = re.compile(r"^(?!.*丁目).*公園$")


def _is_garbage(area_name: str) -> str | None:
    """ゴミデータかどうか判定し、理由を返す。"""
    if _FUZYO_PATTERN.search(area_name):
        return "以下不詳"
    if _PARK_PATTERN.search(area_name):
        return "公園名"
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB 書き込みを行わずに対象レコードを表示",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを出力",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("=== ゴミデータ除去開始 ===")

    # 1. town_crimes の全 area_name を取得
    logger.info("Step 1: town_crimes からユニーク area_name を取得中...")
    rows = select_all("town_crimes", "id,area_name")
    logger.info("town_crimes: %d レコード取得", len(rows))

    # 2. ゴミデータを抽出
    garbage_ids: list[str] = []
    garbage_by_reason: dict[str, list[str]] = {}

    for row in rows:
        area_name = row["area_name"]
        reason = _is_garbage(area_name)
        if reason:
            garbage_ids.append(row["id"])
            garbage_by_reason.setdefault(reason, []).append(area_name)

    if not garbage_ids:
        logger.info("ゴミデータなし。処理終了。")
        return

    # 3. 集計表示
    for reason, names in garbage_by_reason.items():
        unique_names = sorted(set(names))
        logger.info(
            "【%s】 %d レコード (%d ユニーク名):",
            reason, len(names), len(unique_names),
        )
        for name in unique_names[:20]:
            logger.info("  - %s", name)
        if len(unique_names) > 20:
            logger.info("  ... 他 %d 件", len(unique_names) - 20)

    logger.info("削除対象: 合計 %d レコード", len(garbage_ids))

    # 4. 削除
    if args.dry_run:
        logger.info("[DRY RUN] DB 削除をスキップ")
    else:
        client = get_client()
        batch_size = 100
        deleted = 0
        for i in range(0, len(garbage_ids), batch_size):
            batch = garbage_ids[i : i + batch_size]
            client.table("town_crimes").delete().in_("id", batch).execute()
            deleted += len(batch)
            if (i + batch_size) % 500 == 0 or i + batch_size >= len(garbage_ids):
                logger.info("  削除進捗: %d / %d", deleted, len(garbage_ids))
        logger.info("town_crimes から %d レコードを削除しました", deleted)

    logger.info("=== ゴミデータ除去完了 ===")


if __name__ == "__main__":
    main()
