#!/usr/bin/env python3
"""
雰囲気データ取得（丁目単位）。

e-Stat API（国勢調査 小地域集計）と Overpass API（OpenStreetMap）を使用して、
各丁目の人口構成・施設数を取得し、タグを自動生成して
area_vibe_data テーブルに UPSERT する。

データソース: e-Stat API + Overpass API
入力テーブル: areas（丁目マスタ）
出力テーブル: area_vibe_data
更新頻度: 年次
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.estat_client import fetch_all_estat_area_data
from lib.normalizer import generate_vibe_tags
from lib.overpass_client import fetch_all_stations_facilities
from lib.supabase_client import get_client, select_all, upsert_records
from config.settings import ESTAT_API_KEY, STATION_RADIUS_M

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def _print_dry_run(records):
    """dry-run 時のプレビュー表示"""
    logger.info("[DRY RUN] %d 件（先頭 20 件を表示）:", len(records))
    for r in records[:20]:
        logger.info(
            "  %s | 若年%.1f%% 家族%.1f%% 高齢%.1f%% | 昼夜比%.2f | 単身%.1f%% | "
            "飲食%d コンビニ%d 公園%d 学校%d 病院%d | %s",
            r["area_name"],
            r["population_young_ratio"] * 100,
            r["population_family_ratio"] * 100,
            r["population_elderly_ratio"] * 100,
            r["daytime_population_ratio"],
            r["single_household_ratio"] * 100,
            r["restaurant_count"],
            r["convenience_store_count"],
            r["park_count"],
            r["school_count"],
            r["hospital_count"],
            ", ".join(r["tags"]) if r["tags"] else "（タグなし）",
        )
    if len(records) > 20:
        logger.info("  ... 他 %d 件", len(records) - 20)


def _upsert_all(records):
    """全レコードをバッチ UPSERT"""
    logger.info("area_vibe_data テーブルに UPSERT 中...")
    batch_size = 100
    total = 0
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        count = upsert_records("area_vibe_data", batch, on_conflict="area_name")
        total += count
        if (i + batch_size) % 500 == 0 or i + batch_size >= len(records):
            logger.info("  進捗: %d / %d", min(i + batch_size, len(records)), len(records))
    logger.info("area_vibe_data: %d 件登録", total)


def main(args):
    """メイン処理"""
    logger.info("=== 雰囲気データ取得開始（丁目単位）===")

    # 1. areas テーブルから全丁目を取得
    logger.info("Step 1: 丁目データ取得中...")
    if args.area_name:
        client = get_client()
        result = (
            client.table("areas")
            .select("area_name,lat,lng,municipality_code,key_code")
            .eq("area_name", args.area_name)
            .execute()
        )
        areas = result.data or []
    else:
        areas = select_all(
            "areas", "area_name,lat,lng,municipality_code,key_code"
        )

    if not areas:
        logger.error("丁目データが見つかりません")
        return

    # lat/lng が欠損しているエリアを除外
    valid_areas = []
    skipped = 0
    for area in areas:
        if area.get("lat") is None or area.get("lng") is None:
            skipped += 1
            continue
        valid_areas.append(area)

    if skipped:
        logger.warning("位置情報なし: %d エリアをスキップ", skipped)

    # --resume: 既存データのあるエリアをスキップ
    if args.resume:
        existing = select_all("area_vibe_data", "area_name")
        existing_names = {r["area_name"] for r in existing}
        before = len(valid_areas)
        valid_areas = [a for a in valid_areas if a["area_name"] not in existing_names]
        logger.info(
            "レジューム: %d エリア済み → 残り %d エリア", before - len(valid_areas), len(valid_areas)
        )
        if not valid_areas:
            logger.info("全エリア処理済みです")
            return

    if args.limit:
        valid_areas = valid_areas[: args.limit]

    logger.info("対象丁目数: %d", len(valid_areas))

    # 2. e-Stat API で人口構成データを取得（小地域 or 市区町村フォールバック）
    estat_data: dict = {}
    daytime_by_muni: dict = {}
    is_municipality_level = True

    if not args.skip_estat:
        logger.info("Step 2: e-Stat API データ取得中...")
        raw_estat = fetch_all_estat_area_data(ESTAT_API_KEY)

        # 特殊キーを取り出す
        daytime_by_muni = raw_estat.pop("_daytime_by_muni", {})
        is_municipality_level = raw_estat.pop("_is_municipality_level", True)
        estat_data = raw_estat

        level_str = "市区町村" if is_municipality_level else "小地域"
        logger.info(
            "e-Stat データ: %d エリア (%sレベル), 昼夜間=%d 市区町村",
            len(estat_data), level_str, len(daytime_by_muni),
        )
    else:
        logger.info("Step 2: e-Stat API スキップ (--skip-estat)")

    # 3. e-Stat データを事前にマッチング用の関数にまとめる
    def _build_record(area, facilities):
        """1エリア分のレコードを構築"""
        key_code = area.get("key_code", "")
        muni_code = area.get("municipality_code", "")

        if is_municipality_level:
            estat = estat_data.get(muni_code, {})
        else:
            estat = estat_data.get(key_code, {})
            if not estat:
                estat = estat_data.get(muni_code, {})

        daytime = daytime_by_muni.get(muni_code, {})

        young_ratio = estat.get("young_ratio", 0.0)
        family_ratio = estat.get("family_ratio", 0.0)
        elderly_ratio = estat.get("elderly_ratio", 0.0)
        daytime_ratio = daytime.get("daytime_ratio", 1.0)
        single_ratio = estat.get("single_ratio", 0.0)

        tags = generate_vibe_tags(
            young_ratio=young_ratio,
            family_ratio=family_ratio,
            elderly_ratio=elderly_ratio,
            daytime_ratio=daytime_ratio,
            single_ratio=single_ratio,
            restaurant_count=facilities["restaurant_count"],
            park_count=facilities["park_count"],
        )

        return {
            "area_name": area["area_name"],
            "population_young_ratio": young_ratio,
            "population_family_ratio": family_ratio,
            "population_elderly_ratio": elderly_ratio,
            "daytime_population_ratio": daytime_ratio,
            "single_household_ratio": single_ratio,
            "restaurant_count": facilities["restaurant_count"],
            "convenience_store_count": facilities["convenience_store_count"],
            "park_count": facilities["park_count"],
            "school_count": facilities["school_count"],
            "hospital_count": facilities["hospital_count"],
            "tags": tags,
        }

    # 4. Overpass API + レコード構築 + 逐次書き込み
    #    バッチごとに DB に保存するため、中断しても処理済み分は残る
    if args.skip_osm:
        logger.info("Step 3: Overpass API スキップ (--skip-osm)")
        zero = {
            "restaurant_count": 0, "convenience_store_count": 0,
            "park_count": 0, "school_count": 0, "hospital_count": 0,
        }
        all_facilities = [zero for _ in valid_areas]

        records = [_build_record(a, f) for a, f in zip(valid_areas, all_facilities)]
        logger.info("レコード生成完了: %d 件", len(records))

        if args.dry_run:
            _print_dry_run(records)
        else:
            _upsert_all(records)
    else:
        logger.info("Step 3: Overpass API + 逐次書き込み...")
        from lib.overpass_client import (
            _BATCH_SIZE, _BATCH_DELAY, _ENDPOINTS,
            fetch_batch_facilities,
        )
        import math
        import time

        total = len(valid_areas)
        num_batches = math.ceil(total / _BATCH_SIZE)
        total_saved = 0

        logger.info(
            "バッチ取得モード: %d 地点 → %d バッチ (各%d地点, %ds間隔, 逐次DB保存)",
            total, num_batches, _BATCH_SIZE, _BATCH_DELAY,
        )

        for batch_idx in range(num_batches):
            start = batch_idx * _BATCH_SIZE
            end = min(start + _BATCH_SIZE, total)
            batch_areas = valid_areas[start:end]

            if batch_idx > 0:
                time.sleep(_BATCH_DELAY)

            ep_idx = batch_idx % len(_ENDPOINTS)
            batch_facilities = fetch_batch_facilities(batch_areas, args.radius, ep_idx)

            # レコード構築
            batch_records = [
                _build_record(a, f) for a, f in zip(batch_areas, batch_facilities)
            ]

            # 逐次 DB 書き込み（dry-run でなければ）
            if not args.dry_run:
                upsert_records("area_vibe_data", batch_records, on_conflict="area_name")

            total_saved += len(batch_records)

            if (batch_idx + 1) % 10 == 0 or end == total:
                logger.info(
                    "進捗: %d / %d 地点 (バッチ %d/%d, DB保存済み: %d)",
                    end, total, batch_idx + 1, num_batches, total_saved,
                )

        if args.dry_run:
            logger.info("[DRY RUN] 全 %d 件（DB書き込みなし）", total_saved)

        logger.info("area_vibe_data: %d 件処理完了", total_saved)

    logger.info("=== 雰囲気データ取得完了 ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--area-name",
        type=str,
        default=None,
        help="特定の丁目名のみ処理（省略時は全丁目）",
    )
    parser.add_argument(
        "--radius",
        type=float,
        default=STATION_RADIUS_M,
        help=f"検索半径（メートル、デフォルト: {STATION_RADIUS_M}m）",
    )
    parser.add_argument(
        "--skip-estat",
        action="store_true",
        help="e-Stat API の呼び出しをスキップ",
    )
    parser.add_argument(
        "--skip-osm",
        action="store_true",
        help="Overpass API の呼び出しをスキップ",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB書き込みを行わずに処理結果を表示",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="処理件数制限（デバッグ用）",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="area_vibe_data に既存のエリアをスキップして途中再開",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを出力",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    main(args)
