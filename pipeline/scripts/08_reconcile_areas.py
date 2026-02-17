#!/usr/bin/env python3
"""
areas / town_crimes 名前照合。

areas テーブルと town_crimes テーブルの area_name を比較し、
不整合を修正する。

- Type A（親子照合）: town_crimes にあるが areas に完全一致しない名前を、
  areas の子エリア（丁目付き）にマッチさせ、重心 lat/lng を設定
- Type B（犯罪ゼロ）: areas にあるが town_crimes にない area_name に対し、
  各年の犯罪 0 件レコードを INSERT

対象テーブル: town_crimes
更新頻度: ワンタイム（areas 更新後に実行）
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.crime_parser import find_parent_child_matches
from lib.supabase_client import get_client, select_all, upsert_records

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# town_crimes に存在する年の範囲
CRIME_YEARS = list(range(2017, 2026))


def _compute_centroid(children: list[dict]) -> tuple[float, float] | None:
    """子エリアの lat/lng 重心を計算"""
    valid = [(c["lat"], c["lng"]) for c in children if c.get("lat") and c.get("lng")]
    if not valid:
        return None
    avg_lat = sum(lat for lat, _ in valid) / len(valid)
    avg_lng = sum(lng for _, lng in valid) / len(valid)
    return avg_lat, avg_lng


def reconcile_type_a(
    crime_names: set[str],
    area_names: set[str],
    areas_by_name: dict[str, dict],
    dry_run: bool,
) -> int:
    """
    Type A: 親子照合。
    town_crimes の親エリア（丁目なし）→ areas の子エリア（丁目付き）の重心を設定。
    """
    matches = find_parent_child_matches(crime_names, area_names)
    if not matches:
        logger.info("[Type A] 親子照合: マッチなし")
        return 0

    logger.info("[Type A] 親子照合: %d 件の親エリアがマッチ", len(matches))

    client = get_client()
    updated = 0

    for parent, children_names in sorted(matches.items()):
        # 子エリアの lat/lng を取得
        children = [areas_by_name[c] for c in children_names if c in areas_by_name]
        centroid = _compute_centroid(children)

        if centroid is None:
            logger.debug("  %s → 子エリアに座標なし、スキップ", parent)
            continue

        lat, lng = centroid
        logger.info(
            "  %s → %d 子エリア → 重心 (%.4f, %.4f)",
            parent, len(children_names), lat, lng,
        )

        if not dry_run:
            # town_crimes の該当親エリアの lat/lng を更新
            client.table("town_crimes").update(
                {"lat": lat, "lng": lng}
            ).eq("area_name", parent).execute()

        updated += 1

    logger.info("[Type A] %d 件の親エリアの座標を更新", updated)
    return updated


def reconcile_type_b(
    crime_names: set[str],
    area_names: set[str],
    areas_by_name: dict[str, dict],
    crime_years: list[int],
    dry_run: bool,
) -> int:
    """
    Type B: 犯罪ゼロ。
    areas にあるが town_crimes にない area_name に対し、各年の犯罪 0 件レコードを INSERT。
    """
    missing = area_names - crime_names

    # 親子照合でカバーされる子は除外しない（子エリアに独立レコードがあってよい）
    # ただし、crime_names 側から子供として使われている名前は既に crime_names にある

    if not missing:
        logger.info("[Type B] 犯罪ゼロ照合: 不足エリアなし")
        return 0

    logger.info("[Type B] 犯罪ゼロ照合: %d エリア x %d 年 = 最大 %d 件",
                len(missing), len(crime_years), len(missing) * len(crime_years))

    records = []
    for area_name in sorted(missing):
        area = areas_by_name.get(area_name)
        if area is None:
            continue

        muni_code = area.get("municipality_code", "")
        muni_name = area.get("municipality_name", "")
        lat = area.get("lat")
        lng = area.get("lng")

        for year in crime_years:
            records.append({
                "area_name": area_name,
                "municipality_code": muni_code,
                "municipality_name": muni_name,
                "year": year,
                "total_crimes": 0,
                "crimes_violent": 0,
                "crimes_assault": 0,
                "crimes_theft": 0,
                "crimes_intellectual": 0,
                "crimes_other": 0,
                "lat": lat,
                "lng": lng,
            })

    logger.info("[Type B] 生成レコード数: %d", len(records))

    if dry_run:
        logger.info("[DRY RUN] DB 書き込みをスキップ（先頭 20 件を表示）:")
        for r in records[:20]:
            logger.info(
                "  %s | %d年 | 犯罪計=%d | (%.4f, %.4f)",
                r["area_name"], r["year"], r["total_crimes"],
                r["lat"] or 0, r["lng"] or 0,
            )
        if len(records) > 20:
            logger.info("  ... 他 %d 件", len(records) - 20)
        return len(records)

    # バッチ UPSERT
    batch_size = 100
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        count = upsert_records("town_crimes", batch, on_conflict="area_name,year")
        total += count
        if (i + batch_size) % 1000 == 0 or i + batch_size >= len(records):
            logger.info("  進捗: %d / %d", min(i + batch_size, len(records)), len(records))

    logger.info("[Type B] town_crimes に %d 件を upsert", total)
    return total


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
    parser.add_argument(
        "--skip-type-a",
        action="store_true",
        help="Type A（親子照合）をスキップ",
    )
    parser.add_argument(
        "--skip-type-b",
        action="store_true",
        help="Type B（犯罪ゼロ）をスキップ",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("=== areas / town_crimes 名前照合開始 ===")

    # 1. areas テーブルから全レコード取得
    logger.info("Step 1: areas テーブル取得中...")
    areas = select_all("areas", "area_name,lat,lng,municipality_code,municipality_name")
    area_names = {a["area_name"] for a in areas}
    areas_by_name = {a["area_name"]: a for a in areas}
    logger.info("areas: %d エリア", len(area_names))

    # 2. town_crimes テーブルからユニーク area_name 取得
    logger.info("Step 2: town_crimes テーブル取得中...")
    crimes = select_all("town_crimes", "area_name")
    crime_names = {c["area_name"] for c in crimes}
    logger.info("town_crimes: %d ユニーク area_name", len(crime_names))

    # 3. 集合比較サマリー
    both = area_names & crime_names
    only_areas = area_names - crime_names
    only_crimes = crime_names - area_names
    logger.info(
        "集合比較: 共通=%d, areas のみ=%d, town_crimes のみ=%d",
        len(both), len(only_areas), len(only_crimes),
    )

    # 4. Type A: 親子照合
    if not args.skip_type_a:
        reconcile_type_a(crime_names, area_names, areas_by_name, args.dry_run)
    else:
        logger.info("[Type A] スキップ (--skip-type-a)")

    # 5. Type B: 犯罪ゼロ INSERT
    if not args.skip_type_b:
        reconcile_type_b(crime_names, area_names, areas_by_name, CRIME_YEARS, args.dry_run)
    else:
        logger.info("[Type B] スキップ (--skip-type-b)")

    logger.info("=== areas / town_crimes 名前照合完了 ===")


if __name__ == "__main__":
    main()
