#!/usr/bin/env python3
"""
05_calculate_scores.py - 全駅スコア再計算

全駅の各データソースからスコアを再計算し、
ランキングを更新する。

各パイプライン（02〜04）で個別にスコアを計算しているが、
このスクリプトで全駅の相対的なランキングを再計算する。

実行方法:
  python scripts/05_calculate_scores.py
  python scripts/05_calculate_scores.py --dry-run
  python scripts/05_calculate_scores.py --table safety_scores --verbose
"""

import argparse
import logging
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.supabase_client import get_client, upsert_records
from lib.normalizer import normalize_score

logger = logging.getLogger(__name__)

PAGE_SIZE = 1000


def fetch_all_rows(table: str, columns: str) -> list[dict]:
    """ページネーションで全行を取得（Supabase のデフォルト1000件制限を回避）"""
    client = get_client()
    rows: list[dict] = []
    offset = 0
    while True:
        page = (
            client.table(table)
            .select(columns)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        batch = page.data or []
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def recalculate_safety_scores(dry_run: bool) -> int:
    """
    safety_scores テーブルのスコアとランキングを再計算。

    年ごとに:
    1. total_crimes を収集
    2. 反転（犯罪が少ない = 高スコア）
    3. normalize_score で偏差値化
    4. スコア降順でランク付与
    """
    records = fetch_all_rows("safety_scores", "id,station_id,year,total_crimes")
    if not records:
        logger.warning("safety_scores レコードなし - スキップ")
        return 0

    logger.info("safety_scores 取得件数: %d", len(records))

    # 年ごとにグループ化
    by_year: dict[int, list[dict]] = defaultdict(list)
    for r in records:
        by_year[r["year"]].append(r)

    updates = []
    for year in sorted(by_year.keys()):
        year_records = by_year[year]
        logger.info("  %d年: %d 駅", year, len(year_records))

        # total_crimes を収集して反転
        all_totals = [r["total_crimes"] for r in year_records]
        max_crimes = max(all_totals)
        inverted = [max_crimes - t for t in all_totals]

        # 偏差値スコア算出
        scores = normalize_score(inverted)

        # ランキング（スコア降順、rank 1 = 最も安全）
        indexed_scores = sorted(enumerate(scores), key=lambda x: -x[1])
        rank_map = {idx: rank + 1 for rank, (idx, _) in enumerate(indexed_scores)}

        for i, r in enumerate(year_records):
            updates.append({
                "id": r["id"],
                "station_id": r["station_id"],
                "year": r["year"],
                "score": round(scores[i], 1),
                "rank": rank_map[i],
            })

        if dry_run:
            # 上位・下位10駅を表示
            sorted_pairs = sorted(
                zip(year_records, scores, [rank_map[i] for i in range(len(year_records))]),
                key=lambda x: -x[1],
            )
            logger.info("  === %d年 安全な駅 TOP 10 ===", year)
            for r, score, rank in sorted_pairs[:10]:
                logger.info(
                    "    #%d station_id=%s | 犯罪計=%d | スコア=%.1f",
                    rank, r["station_id"], r["total_crimes"], score,
                )
            logger.info("  === %d年 犯罪が多い駅 BOTTOM 10 ===", year)
            for r, score, rank in sorted_pairs[-10:]:
                logger.info(
                    "    #%d station_id=%s | 犯罪計=%d | スコア=%.1f",
                    rank, r["station_id"], r["total_crimes"], score,
                )

    if dry_run:
        logger.info("[DRY RUN] safety_scores: %d 件の更新をスキップ", len(updates))
        return len(updates)

    count = upsert_records("safety_scores", updates)
    logger.info("safety_scores: %d 件を更新", count)
    return count


def recalculate_hazard_scores(dry_run: bool) -> int:
    """
    hazard_data テーブルのランキングを再計算。

    score（0-100、高いほど安全）は 03_fetch_hazard.py で算出済み。
    ここでは score 降順でランクを付与する。
    """
    records = fetch_all_rows(
        "hazard_data",
        "id,station_id,score,flood_score,landslide_score,tsunami_score,liquefaction_score",
    )
    if not records:
        logger.info("hazard_data レコードなし - スキップ")
        return 0

    logger.info("hazard_data 取得件数: %d", len(records))

    # score 降順でランキング（同スコアは同順位）
    sorted_records = sorted(records, key=lambda r: -(r.get("score") or 0))

    updates = []
    for rank, r in enumerate(sorted_records, start=1):
        updates.append({
            "id": r["id"],
            "station_id": r["station_id"],
            "rank": rank,
        })

    if dry_run:
        logger.info("[DRY RUN] hazard_data: %d 件のランキング更新をスキップ", len(updates))
        logger.info("  === 安全な駅 TOP 10 ===")
        for r in sorted_records[:10]:
            logger.info(
                "    station_id=%s | score=%.1f (洪水=%.1f 土砂=%.1f 津波=%.1f 液状=%.1f)",
                r["station_id"], r.get("score", 0),
                r.get("flood_score", 0), r.get("landslide_score", 0),
                r.get("tsunami_score", 0), r.get("liquefaction_score", 0),
            )
        logger.info("  === リスクが高い駅 BOTTOM 10 ===")
        for r in sorted_records[-10:]:
            logger.info(
                "    station_id=%s | score=%.1f (洪水=%.1f 土砂=%.1f 津波=%.1f 液状=%.1f)",
                r["station_id"], r.get("score", 0),
                r.get("flood_score", 0), r.get("landslide_score", 0),
                r.get("tsunami_score", 0), r.get("liquefaction_score", 0),
            )
        return len(updates)

    count = upsert_records("hazard_data", updates, on_conflict="station_id")
    logger.info("hazard_data: %d 件のランキングを更新", count)
    return count


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

    total_updated = 0

    if args.table in ("safety_scores", "all"):
        logger.info("--- 治安スコア再計算 ---")
        total_updated += recalculate_safety_scores(args.dry_run)

    if args.table in ("hazard_data", "all"):
        logger.info("--- 災害スコア再計算 ---")
        total_updated += recalculate_hazard_scores(args.dry_run)

    logger.info("=== スコア再計算完了 (合計: %d 件) ===", total_updated)


if __name__ == "__main__":
    main()
