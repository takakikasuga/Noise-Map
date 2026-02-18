#!/usr/bin/env python3
"""
治安データ取得。

警視庁の犯罪統計CSV（町丁目レベル）をパースし、
town_crimes テーブルに UPSERT する。

注意: 駅ごとの safety_scores 算出は 05_calculate_scores.py で一元管理。
      compute_station_scores() はレガシーとして残すが、main() からは呼ばない。

データソース: 警視庁「区市町村の町丁別、罪種別及び手口別認知件数」
出力テーブル: town_crimes
更新頻度: 年次
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.crime_parser import (
    attach_boundaries,
    load_boundaries,
    parse_crime_csv,
)
from lib.normalizer import normalize_score
from lib.supabase_client import get_client, upsert_records, select_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "raw"
DEFAULT_SHP = str(DATA_DIR / "administrative_area" / "tokyo" / "r2ka13.shp")
CSV_FILES = {
    2017: str(DATA_DIR / "metropolitan" / "H29.csv"),
    2018: str(DATA_DIR / "metropolitan" / "H30.csv"),
    2019: str(DATA_DIR / "metropolitan" / "H31.csv"),
    2020: str(DATA_DIR / "metropolitan" / "R2.csv"),
    2021: str(DATA_DIR / "metropolitan" / "R3.csv"),
    2022: str(DATA_DIR / "metropolitan" / "R4.csv"),
    2023: str(DATA_DIR / "metropolitan" / "R5.csv"),
    2024: str(DATA_DIR / "metropolitan" / "R6.csv"),
    2025: str(DATA_DIR / "metropolitan" / "R7" / "R7.11.csv"),
}


def upsert_town_crimes(records: list[dict], dry_run: bool) -> int:
    """town_crimes テーブルに UPSERT（バッチ処理）"""
    if dry_run:
        logger.info("[DRY RUN] town_crimes: %d 件", len(records))
        for r in records[:10]:
            has_geo = "○" if r.get("lat") else "×"
            logger.info(
                "  %s | %s | 犯罪計=%d | 座標=%s",
                r["area_name"], r["municipality_name"],
                r["total_crimes"], has_geo,
            )
        if len(records) > 10:
            logger.info("  ... 他 %d 件", len(records) - 10)
        return len(records)

    client = get_client()
    batch_size = 100
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        result = client.table("town_crimes").upsert(
            batch, on_conflict="area_name,year"
        ).execute()
        total += len(result.data) if result.data else 0
        if (i + batch_size) % 500 == 0 or i + batch_size >= len(records):
            logger.info("  town_crimes upsert: %d / %d", min(i + batch_size, len(records)), len(records))
    return total


def compute_station_scores(year: int, dry_run: bool) -> int:
    """
    town_crimes を区市町村レベルで集計し、各駅の safety_scores を算出。
    犯罪率（千人あたり）ベースで偏差値を計算。
    """
    client = get_client()

    # 駅一覧取得
    stations = select_all("stations", "id,name,municipality_code,municipality_name")
    logger.info("駅数: %d", len(stations))

    # town_crimes を区市町村別に集計（ページネーションで全行取得）
    cols = "municipality_code,total_crimes,crimes_violent,crimes_assault,crimes_theft,crimes_intellectual,crimes_other"
    rows = []
    page_size = 1000
    offset = 0
    while True:
        page = (
            client.table("town_crimes")
            .select(cols)
            .eq("year", year)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = page.data or []
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    logger.info("town_crimes 取得行数: %d", len(rows))

    muni_agg: dict[str, dict] = {}
    for r in rows:
        code = r["municipality_code"]
        if code not in muni_agg:
            muni_agg[code] = {
                "total_crimes": 0, "crimes_violent": 0, "crimes_assault": 0,
                "crimes_theft": 0, "crimes_intellectual": 0, "crimes_other": 0,
            }
        for key in muni_agg[code]:
            muni_agg[code][key] += r[key]

    logger.info("集計済み市区町村: %d", len(muni_agg))

    # 人口データ取得（area_vibe_data → 市区町村別に集約）
    pop_rows = select_all("area_vibe_data", "area_name,total_population")
    # area_name から municipality_code を取得するため、areas テーブル参照
    area_muni = select_all("areas", "area_name,municipality_code")
    area_to_muni = {r["area_name"]: r["municipality_code"] for r in area_muni}

    muni_pop: dict[str, int] = {}
    for r in pop_rows:
        pop = r.get("total_population")
        if pop and pop > 0:
            muni_code = area_to_muni.get(r["area_name"])
            if muni_code:
                muni_pop[muni_code] = muni_pop.get(muni_code, 0) + pop
    logger.info("市区町村別人口データ: %d 市区町村", len(muni_pop))

    # 前年データ取得（previous_year_total 用）
    prev_year = year - 1
    prev_rows = []
    offset = 0
    while True:
        page = (
            client.table("town_crimes")
            .select("municipality_code,total_crimes")
            .eq("year", prev_year)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = page.data or []
        prev_rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    prev_agg: dict[str, int] = {}
    for r in prev_rows:
        code = r["municipality_code"]
        prev_agg[code] = prev_agg.get(code, 0) + r["total_crimes"]

    # 各駅にスコア付与（犯罪率ベース）
    station_crimes = []
    for s in stations:
        code = s["municipality_code"]
        agg = muni_agg.get(code)
        if agg is None:
            continue
        pop = muni_pop.get(code, 0)
        if pop > 0:
            crime_rate = agg["total_crimes"] / pop * 1000
        else:
            crime_rate = None
        station_crimes.append({
            "station": s,
            "crimes": agg,
            "prev_total": prev_agg.get(code),
            "crime_rate": crime_rate,
        })

    # 犯罪率ベースで偏差値化
    scored = [(sc, sc["crime_rate"]) for sc in station_crimes if sc["crime_rate"] is not None]
    unscored = [sc for sc in station_crimes if sc["crime_rate"] is None]

    scores = []
    rank_map = {}
    if scored:
        all_rates = [cr for _, cr in scored]
        max_rate = max(all_rates)
        inverted = [max_rate - cr for cr in all_rates]
        scores = normalize_score(inverted)

        indexed_scores = sorted(enumerate(scores), key=lambda x: -x[1])
        rank_map = {idx: rank + 1 for rank, (idx, _) in enumerate(indexed_scores)}

    # レコード作成
    records = []
    for i, (sc, _) in enumerate(scored):
        records.append({
            "station_id": sc["station"]["id"],
            "year": year,
            "total_crimes": sc["crimes"]["total_crimes"],
            "crimes_violent": sc["crimes"]["crimes_violent"],
            "crimes_assault": sc["crimes"]["crimes_assault"],
            "crimes_theft": sc["crimes"]["crimes_theft"],
            "crimes_intellectual": sc["crimes"]["crimes_intellectual"],
            "crimes_other": sc["crimes"]["crimes_other"],
            "score": round(scores[i], 1),
            "rank": rank_map.get(i),
            "previous_year_total": sc["prev_total"],
        })
    for sc in unscored:
        records.append({
            "station_id": sc["station"]["id"],
            "year": year,
            "total_crimes": sc["crimes"]["total_crimes"],
            "crimes_violent": sc["crimes"]["crimes_violent"],
            "crimes_assault": sc["crimes"]["crimes_assault"],
            "crimes_theft": sc["crimes"]["crimes_theft"],
            "crimes_intellectual": sc["crimes"]["crimes_intellectual"],
            "crimes_other": sc["crimes"]["crimes_other"],
            "score": None,
            "rank": None,
            "previous_year_total": sc["prev_total"],
        })

    if dry_run:
        logger.info("[DRY RUN] safety_scores: %d 件", len(records))
        by_score = sorted(
            [(sc, rec) for (sc, _), rec in zip(scored, records[:len(scored)])],
            key=lambda x: -(x[1].get("score") or 0),
        )
        logger.info("  === 安全な駅 TOP 5 ===")
        for sc, rec in by_score[:5]:
            logger.info(
                "  #%d %s (%s) | 犯罪計=%d | 犯罪率=%.1f | スコア=%.1f",
                rec["rank"], sc["station"]["name"],
                sc["station"]["municipality_name"],
                rec["total_crimes"], sc["crime_rate"], rec["score"],
            )
        logger.info("  === 犯罪率が高い駅 TOP 5 ===")
        for sc, rec in by_score[-5:]:
            logger.info(
                "  #%d %s (%s) | 犯罪計=%d | 犯罪率=%.1f | スコア=%.1f",
                rec["rank"], sc["station"]["name"],
                sc["station"]["municipality_name"],
                rec["total_crimes"], sc["crime_rate"], rec["score"],
            )
        if unscored:
            logger.info("  人口データなし: %d 駅", len(unscored))
        return len(records)

    count = upsert_records("safety_scores", records, on_conflict="station_id,year")
    return count


def main(args):
    """メイン処理"""
    logger.info("開始: 治安データ取得")

    # 1. 境界データ読み込み
    boundaries = load_boundaries(args.shp_path)

    # 2. 処理対象年を決定
    if args.year:
        years = {args.year: CSV_FILES[args.year]}
    else:
        years = CSV_FILES

    # 3. 各年のCSVを処理
    for year, csv_path in years.items():
        logger.info("=== %d年 データ処理 ===", year)

        # 3a. CSVパース
        records = parse_crime_csv(csv_path, year)
        if args.limit:
            records = records[: args.limit]

        # 3b. ポリゴン付与
        records = attach_boundaries(records, boundaries)

        # 3c. town_crimes UPSERT
        count = upsert_town_crimes(records, args.dry_run)
        logger.info("%d年 town_crimes: %d 件処理", year, count)

    # NOTE: 駅スコア算出は 05_calculate_scores.py に一元化。
    # compute_station_scores() を直接呼びたい場合は --score フラグを使用。
    if getattr(args, "score", False):
        for year in years:
            logger.info("=== %d年 駅スコア算出 ===", year)
            count = compute_station_scores(year, args.dry_run)
            logger.info("%d年 safety_scores: %d 件処理", year, count)

    logger.info("完了")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shp-path", type=str, default=DEFAULT_SHP, help="境界Shapefileパス")
    parser.add_argument("--year", type=int, choices=list(CSV_FILES.keys()), help="処理する年（省略時は全年）")
    parser.add_argument("--dry-run", action="store_true", help="DB に書き込まない")
    parser.add_argument("--limit", type=int, default=0, help="処理件数制限（デバッグ用）")
    parser.add_argument("--score", action="store_true", help="駅スコアも算出（通常は 05_calculate_scores.py に委譲）")
    parser.add_argument("--verbose", "-v", action="store_true", help="詳細ログを出力")
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    main(args)
