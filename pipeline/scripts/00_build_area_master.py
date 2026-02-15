#!/usr/bin/env python3
"""
丁目マスタ投入。

小地域境界 Shapefile から丁目（町丁目）マスタを生成し、
areas テーブルに UPSERT する。

データソース: 国土数値情報 小地域境界 Shapefile (r2ka13.shp)
出力テーブル: areas
更新頻度: Shapefile 更新時（年次程度）
"""

import argparse
import logging
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.area_master import load_areas_from_shapefile
from lib.geo_utils import romanize_station_name
from lib.supabase_client import upsert_records

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# デフォルトの Shapefile パス
DEFAULT_SHP_PATH = str(
    Path(__file__).resolve().parent.parent
    / "data" / "raw" / "administrative_area" / "tokyo" / "r2ka13.shp"
)


def resolve_duplicate_slugs(records: list[dict]) -> list[dict]:
    """
    area_name_en の重複を解決。
    06_enrich_areas.py の generate_area_slugs パターンを流用。
    """
    slug_counts: dict[str, list[int]] = defaultdict(list)

    for i, rec in enumerate(records):
        slug_counts[rec["area_name_en"]].append(i)

    duplicates = 0
    for slug, indices in slug_counts.items():
        if len(indices) <= 1:
            continue
        duplicates += len(indices)
        logger.warning(
            "スラッグ重複: '%s' (%d 件)", slug, len(indices),
        )
        for seq, idx in enumerate(indices):
            if seq > 0:
                records[idx]["area_name_en"] = f"{slug}-{seq + 1}"

    if duplicates:
        logger.info("重複スラッグ解決: %d 件", duplicates)

    return records


def main(args):
    """メイン処理"""
    logger.info("=== 丁目マスタ投入開始 ===")

    # 1. Shapefile から丁目レコード生成
    shp_path = args.shapefile or DEFAULT_SHP_PATH
    logger.info("Step 1: Shapefile 読み込み: %s", shp_path)
    records = load_areas_from_shapefile(shp_path)

    if not records:
        logger.error("レコードが生成されませんでした")
        return

    logger.info("生成レコード数: %d", len(records))

    # 2. スラッグ重複解決
    logger.info("Step 2: スラッグ重複解決...")
    records = resolve_duplicate_slugs(records)

    # ユニークエリア数のサマリー
    unique_munis = set(r["municipality_code"] for r in records)
    logger.info("カバレッジ: %d 市区町村, %d 丁目", len(unique_munis), len(records))

    # 3. DB 書き込み or プレビュー
    if args.dry_run:
        logger.info("[DRY RUN] %d 件（先頭 20 件を表示）:", len(records))
        for r in records[:20]:
            logger.info(
                "  %s | %s | %s | key=%s | (%.4f, %.4f)",
                r["area_name"],
                r["area_name_en"],
                r["municipality_name"],
                r["key_code"],
                r["lat"],
                r["lng"],
            )
        if len(records) > 20:
            logger.info("  ... 他 %d 件", len(records) - 20)
    else:
        logger.info("Step 3: areas テーブルに UPSERT 中...")
        # バッチで UPSERT（Supabase の制限対応）
        batch_size = 100
        total = 0
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            count = upsert_records("areas", batch, on_conflict="area_name")
            total += count
            if (i + batch_size) % 500 == 0 or i + batch_size >= len(records):
                logger.info(
                    "  進捗: %d / %d",
                    min(i + batch_size, len(records)),
                    len(records),
                )
        logger.info("areas: %d 件登録", total)

    logger.info("=== 丁目マスタ投入完了 ===")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--shapefile",
        type=str,
        default=None,
        help=f"Shapefile パス（デフォルト: {DEFAULT_SHP_PATH}）",
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

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    main(args)
