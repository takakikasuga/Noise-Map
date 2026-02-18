#!/usr/bin/env python3
"""
total_population バックフィル。

area_vibe_data テーブルの total_population カラムに
e-Stat API の人口総数を投入する。
施設データ（Overpass）には触れない。

Usage:
    python pipeline/scripts/11_backfill_population.py --dry-run
    python pipeline/scripts/11_backfill_population.py
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.estat_client import fetch_all_estat_area_data
from lib.supabase_client import get_client, select_all
from config.settings import ESTAT_API_KEY

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def main(args):
    logger.info("=== total_population バックフィル開始 ===")

    # 1. areas テーブルから key_code / municipality_code を取得
    areas = select_all("areas", "area_name,key_code,municipality_code")
    logger.info("エリア数: %d", len(areas))

    # 2. 既存の area_vibe_data を取得
    existing = select_all("area_vibe_data", "area_name,total_population")
    existing_map = {r["area_name"]: r.get("total_population") for r in existing}
    already_set = sum(1 for v in existing_map.values() if v is not None and v > 0)
    logger.info(
        "area_vibe_data: %d 件（total_population 設定済み: %d）",
        len(existing_map), already_set,
    )

    if already_set == len(existing_map) and not args.force:
        logger.info("全件設定済み — スキップ（--force で強制更新）")
        return

    # 3. e-Stat API から人口データを取得
    logger.info("e-Stat API から人口データ取得中...")
    raw_estat = fetch_all_estat_area_data(ESTAT_API_KEY)
    daytime_by_muni = raw_estat.pop("_daytime_by_muni", {})
    is_municipality_level = raw_estat.pop("_is_municipality_level", True)
    estat_data = raw_estat

    level_str = "市区町村" if is_municipality_level else "小地域"
    logger.info("e-Stat データ: %d エリア (%sレベル)", len(estat_data), level_str)

    # 4. マッチングして total_population を取得
    updates = []
    matched = 0
    no_match = 0
    no_vibe = 0

    for area in areas:
        area_name = area["area_name"]
        if area_name not in existing_map:
            no_vibe += 1
            continue

        key_code = area.get("key_code", "")
        muni_code = area.get("municipality_code", "")

        if is_municipality_level:
            estat = estat_data.get(muni_code, {})
        else:
            estat = estat_data.get(key_code, {})
            if not estat:
                estat = estat_data.get(muni_code, {})

        total_pop = estat.get("total_population")
        if total_pop is not None and total_pop > 0:
            updates.append({
                "area_name": area_name,
                "total_population": int(total_pop),
            })
            matched += 1
        else:
            no_match += 1

    logger.info(
        "マッチング結果: 成功=%d, 人口データなし=%d, vibe未登録=%d",
        matched, no_match, no_vibe,
    )

    if not updates:
        logger.warning("更新対象なし")
        return

    if args.dry_run:
        logger.info("[DRY RUN] %d 件の更新をスキップ", len(updates))
        # サンプル表示
        for u in updates[:10]:
            logger.info("  %s → total_population=%d", u["area_name"], u["total_population"])
        return

    # 5. バッチ更新
    client = get_client()
    batch_size = 200
    total = 0
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        result = (
            client.table("area_vibe_data")
            .upsert(batch, on_conflict="area_name")
            .execute()
        )
        total += len(batch)
        if (i // batch_size + 1) % 10 == 0:
            logger.info("  進捗: %d / %d", total, len(updates))

    logger.info("total_population 更新完了: %d 件", total)
    logger.info("=== バックフィル完了 ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="DB更新せずプレビューのみ")
    parser.add_argument("--force", action="store_true", help="設定済みでも強制更新")
    main(parser.parse_args())
