#!/usr/bin/env python3
"""
05_calculate_scores.py - 全駅スコア再計算（Single Source of Truth）

safety_scores および hazard_data のスコア・ランキングを再計算する
正規パイプライン。02_fetch_safety.py は town_crimes の UPSERT のみ行い、
スコア算出はこのスクリプトに一元化されている。

safety_scores: 各駅の周辺（半径1km）のエリアを空間集約し、
犯罪率（千人あたり）ベースで偏差値を算出する。

hazard_data: 03_fetch_hazard.py で算出済みの score に基づき
ランキングのみ再計算する。

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

from lib.geo_utils import haversine_distance
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

    各駅の周辺（半径1000m以内）のエリアを空間集約し、
    犯罪率（千人あたり）ベースで偏差値を算出する。
    """
    # 既存の safety_scores レコードを取得（ID保持のため）
    records = fetch_all_rows("safety_scores", "id,station_id,year,total_crimes")
    if not records:
        logger.warning("safety_scores レコードなし - スキップ")
        return 0
    logger.info("safety_scores 取得件数: %d", len(records))

    # 駅データ取得（lat/lng 必須）
    stations = fetch_all_rows("stations", "id,name,lat,lng")
    station_map = {s["id"]: s for s in stations if s.get("lat") and s.get("lng")}
    logger.info("座標あり駅数: %d / %d", len(station_map), len(stations))

    # town_crimes データ取得（lat/lng 付き）
    town_data = fetch_all_rows("town_crimes", "area_name,year,total_crimes,lat,lng")
    logger.info("town_crimes 取得件数: %d", len(town_data))

    # 人口データ取得
    pop_data = fetch_all_rows("area_vibe_data", "area_name,total_population")
    pop_map = {r["area_name"]: r.get("total_population") for r in pop_data}
    logger.info("人口データ取得: %d エリア", len(pop_map))

    # 年ごとにグループ化
    by_year: dict[int, list[dict]] = defaultdict(list)
    for r in records:
        by_year[r["year"]].append(r)

    # town_crimes を年ごとにグループ化（座標あり のみ）
    town_by_year: dict[int, list[dict]] = defaultdict(list)
    for t in town_data:
        if t.get("lat") and t.get("lng"):
            town_by_year[t["year"]].append(t)

    RADIUS_M = 1000

    updates = []
    for year in sorted(by_year.keys()):
        year_records = by_year[year]
        year_towns = town_by_year.get(year, [])
        logger.info("  %d年: %d 駅, %d エリア（座標あり）", year, len(year_records), len(year_towns))

        # 各駅の犯罪率を計算
        station_rates: list[tuple[dict, float | None]] = []
        for rec in year_records:
            station = station_map.get(rec["station_id"])
            if not station:
                station_rates.append((rec, None))
                continue

            # 半径内のエリアを検索
            slat, slng = station["lat"], station["lng"]
            nearby_crimes = 0
            nearby_pop = 0
            for t in year_towns:
                dist = haversine_distance(slat, slng, t["lat"], t["lng"])
                if dist <= RADIUS_M:
                    nearby_crimes += t["total_crimes"]
                    pop = pop_map.get(t["area_name"])
                    if pop and pop > 0:
                        nearby_pop += pop

            if nearby_pop > 0:
                crime_rate = nearby_crimes / nearby_pop * 1000
            else:
                crime_rate = None
            station_rates.append((rec, crime_rate))

        # 犯罪率ベースで偏差値計算
        scored = [(rec, cr) for rec, cr in station_rates if cr is not None]
        unscored = [(rec, cr) for rec, cr in station_rates if cr is None]

        if scored:
            all_rates = [cr for _, cr in scored]
            max_rate = max(all_rates)
            inverted = [max_rate - cr for cr in all_rates]
            scores = normalize_score(inverted)

            indexed_scores = sorted(enumerate(scores), key=lambda x: -x[1])
            rank_map = {idx: rank + 1 for rank, (idx, _) in enumerate(indexed_scores)}

            for i, (rec, crime_rate) in enumerate(scored):
                updates.append({
                    "id": rec["id"],
                    "station_id": rec["station_id"],
                    "year": rec["year"],
                    "score": round(scores[i], 1),
                    "rank": rank_map[i],
                })

        # スコア算出不可の駅は score=None
        for rec, _ in unscored:
            updates.append({
                "id": rec["id"],
                "station_id": rec["station_id"],
                "year": rec["year"],
                "score": None,
                "rank": None,
            })

        if dry_run and scored:
            sorted_pairs = sorted(
                zip([rec for rec, _ in scored], scores, [rank_map[i] for i in range(len(scored))]),
                key=lambda x: -x[1],
            )
            logger.info("  === %d年 安全な駅 TOP 10 ===", year)
            for r, score, rank in sorted_pairs[:10]:
                s = station_map.get(r["station_id"], {})
                logger.info(
                    "    #%d %s | スコア=%.1f",
                    rank, s.get("name", r["station_id"]), score,
                )
            logger.info("  === %d年 犯罪率が高い駅 BOTTOM 10 ===", year)
            for r, score, rank in sorted_pairs[-10:]:
                s = station_map.get(r["station_id"], {})
                logger.info(
                    "    #%d %s | スコア=%.1f",
                    rank, s.get("name", r["station_id"]), score,
                )
            if unscored:
                logger.info("  スコア算出不可（周辺人口0 or 座標なし）: %d 駅", len(unscored))

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
