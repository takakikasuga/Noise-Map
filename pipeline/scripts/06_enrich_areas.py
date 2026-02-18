#!/usr/bin/env python3
"""
町丁目データ加工: スラッグ生成 + 偏差値計算。

既存の town_crimes テーブルに name_en（URLスラッグ）、score（偏差値）、
rank（順位）を付与する。

出力テーブル: town_crimes（既存行の UPDATE）
更新頻度: town_crimes 投入後に1回
"""

import argparse
import logging
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.geo_utils import romanize_station_name
from lib.normalizer import normalize_score
from lib.supabase_client import get_client, select_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

PAGE_SIZE = 1000


def fetch_all_town_crimes() -> list[dict]:
    """town_crimes の全行をページネーションで取得（UPSERT用に全NOT NULLカラムを含む）"""
    client = get_client()
    cols = "id,area_name,municipality_code,municipality_name,year,total_crimes,crimes_violent,crimes_assault,crimes_theft,crimes_intellectual,crimes_other"
    rows: list[dict] = []
    offset = 0
    while True:
        page = (
            client.table("town_crimes")
            .select(cols)
            .range(offset, offset + PAGE_SIZE - 1)
            .execute()
        )
        batch = page.data or []
        rows.extend(batch)
        if len(batch) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    return rows


def generate_area_slugs(rows: list[dict]) -> dict[str, str]:
    """
    area_name → name_en のマッピングを生成。
    同名エリアが複数ある場合は連番を付加。
    """
    # 全ユニークエリア名を収集
    unique_areas = sorted(set(r["area_name"] for r in rows))
    logger.info("ユニークエリア数: %d", len(unique_areas))

    # ローマ字変換
    slug_map: dict[str, str] = {}
    slug_counts: dict[str, list[str]] = defaultdict(list)

    for area_name in unique_areas:
        slug = romanize_station_name(area_name)
        slug_counts[slug].append(area_name)

    # 重複解決
    for slug, area_names in slug_counts.items():
        if len(area_names) == 1:
            slug_map[area_names[0]] = slug
        else:
            logger.warning("スラッグ重複: '%s' (%d 件): %s", slug, len(area_names), area_names)
            for i, area_name in enumerate(area_names):
                slug_map[area_name] = f"{slug}-{i + 1}" if i > 0 else slug

    return slug_map


def fetch_population_map() -> dict[str, int | None]:
    """area_vibe_data から area_name → total_population のマップを取得"""
    rows = select_all("area_vibe_data", "area_name,total_population")
    pop_map: dict[str, int | None] = {}
    for r in rows:
        pop_map[r["area_name"]] = r.get("total_population")
    logger.info("人口データ取得: %d エリア", len(pop_map))
    return pop_map


def calculate_area_scores(
    rows: list[dict], pop_map: dict[str, int | None]
) -> dict[str, dict[str, float | int | None]]:
    """
    年ごとに犯罪率ベースで偏差値・ランクを計算。
    犯罪率 = total_crimes / population * 1000（千人あたり）
    犯罪率が低いほど高スコア。

    人口データなし or 人口0 のエリアは score=None, rank=None, crime_rate=None。

    Returns:
        {row_id: {"score": float|None, "rank": int|None, "crime_rate": float|None}}
    """
    by_year: dict[int, list[dict]] = defaultdict(list)
    for r in rows:
        by_year[r["year"]].append(r)

    result: dict[str, dict] = {}

    for year in sorted(by_year.keys()):
        year_rows = by_year[year]
        logger.info("  %d年: %d エリア", year, len(year_rows))

        # 犯罪率を計算（人口データありのエリアのみ）
        scored_rows: list[tuple[dict, float]] = []
        skipped = 0
        for r in year_rows:
            pop = pop_map.get(r["area_name"])
            if pop is None or pop == 0:
                result[r["id"]] = {"score": None, "rank": None, "crime_rate": None}
                skipped += 1
                continue
            crime_rate = r["total_crimes"] / pop * 1000
            scored_rows.append((r, crime_rate))

        if skipped:
            logger.info("    人口データなし: %d エリア → スコア計算不可", skipped)

        if not scored_rows:
            continue

        # 犯罪率を反転（低い犯罪率 = 高スコア）
        all_rates = [cr for _, cr in scored_rows]
        max_rate = max(all_rates)
        inverted = [max_rate - cr for cr in all_rates]
        scores = normalize_score(inverted)

        # ランキング（スコア降順）
        indexed = sorted(enumerate(scores), key=lambda x: -x[1])
        rank_map = {idx: rank + 1 for rank, (idx, _) in enumerate(indexed)}

        for i, (r, crime_rate) in enumerate(scored_rows):
            result[r["id"]] = {
                "score": round(scores[i], 1),
                "rank": rank_map[i],
                "crime_rate": round(crime_rate, 2),
            }

    return result


def main(args):
    """メイン処理"""
    logger.info("開始: 町丁目データ加工")

    # 1. 全行取得
    rows = fetch_all_town_crimes()
    logger.info("town_crimes 取得: %d 行", len(rows))

    if not rows:
        logger.warning("town_crimes が空です")
        return

    # 2. スラッグ生成
    logger.info("=== スラッグ生成 ===")
    slug_map = generate_area_slugs(rows)
    logger.info("スラッグ生成完了: %d エリア", len(slug_map))

    # 3. 人口データ取得
    logger.info("=== 人口データ取得 ===")
    pop_map = fetch_population_map()

    # 4. 偏差値計算（犯罪率ベース）
    logger.info("=== 偏差値計算（犯罪率ベース）===")
    score_map = calculate_area_scores(rows, pop_map)
    logger.info("偏差値計算完了: %d 行", len(score_map))

    # 5. 更新レコード作成（全NOT NULLカラムを含めてUPSERT）
    updates = []
    for r in rows:
        name_en = slug_map.get(r["area_name"])
        scores = score_map.get(r["id"], {})
        updates.append({
            **r,
            "name_en": name_en,
            "score": scores.get("score"),
            "rank": scores.get("rank"),
            "crime_rate": scores.get("crime_rate"),
        })

    if args.dry_run:
        logger.info("[DRY RUN] %d 件の更新をスキップ", len(updates))
        # サンプル表示（スコアあり のみ）
        scored = [u for u in updates if u.get("score") is not None]
        unscored = len(updates) - len(scored)
        if unscored:
            logger.info("  スコア算出不可（人口データなし）: %d 件", unscored)
        sample = sorted(scored, key=lambda x: -(x.get("score") or 0))
        logger.info("  === 安全なエリア TOP 10 ===")
        for u in sample[:10]:
            area = next((r for r in rows if r["id"] == u["id"]), None)
            if area:
                logger.info(
                    "    #%s %s | 犯罪計=%d | 犯罪率=%.2f | 偏差値=%.1f | slug=%s",
                    u["rank"], area["area_name"],
                    area["total_crimes"], u.get("crime_rate", 0),
                    u["score"], u["name_en"],
                )
        logger.info("  === 犯罪率が高いエリア BOTTOM 10 ===")
        for u in sample[-10:]:
            area = next((r for r in rows if r["id"] == u["id"]), None)
            if area:
                logger.info(
                    "    #%s %s | 犯罪計=%d | 犯罪率=%.2f | 偏差値=%.1f | slug=%s",
                    u["rank"], area["area_name"],
                    area["total_crimes"], u.get("crime_rate", 0),
                    u["score"], u["name_en"],
                )
        return

    # 6. バッチ UPSERT（全カラム含むため NOT NULL 制約を満たす）
    client = get_client()
    batch_size = 100
    total = 0
    for i in range(0, len(updates), batch_size):
        batch = updates[i : i + batch_size]
        result = client.table("town_crimes").upsert(batch, on_conflict="id").execute()
        total += len(result.data) if result.data else 0
        if (i + batch_size) % 1000 == 0 or i + batch_size >= len(updates):
            logger.info("  更新進捗: %d / %d", min(i + batch_size, len(updates)), len(updates))

    logger.info("完了: %d 件更新", total)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="DB に書き込まない")
    parser.add_argument("--verbose", "-v", action="store_true", help="詳細ログ")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    main(args)
