#!/usr/bin/env python3
"""
災害リスクデータ取得。

不動産情報ライブラリ API を使用して、
各駅周辺の洪水・土砂・津波・液状化リスク情報を取得し、
hazard_data テーブルに UPSERT する。

データソース: 不動産情報ライブラリ API (https://www.reinfolib.mlit.go.jp/)
出力テーブル: hazard_data
更新頻度: 年次
"""

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.reinfolib_client import fetch_station_hazard
from lib.normalizer import calculate_hazard_score
from lib.supabase_client import get_client, upsert_records, select_all
from config.settings import REINFOLIB_API_KEY, STATION_RADIUS_M

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def classify_flood_level(depth: float | None) -> str:
    """洪水浸水深をレベルに分類"""
    if depth is None or depth <= 0:
        return "none"
    if depth < 0.5:
        return "low"
    if depth < 3.0:
        return "moderate"
    if depth < 5.0:
        return "high"
    return "extreme"


def classify_tsunami_level(depth: float | None) -> str:
    """津波浸水深をレベルに分類"""
    if depth is None or depth <= 0:
        return "none"
    if depth < 1.0:
        return "low"
    if depth < 3.0:
        return "moderate"
    if depth < 5.0:
        return "high"
    return "extreme"


def main():
    parser = argparse.ArgumentParser(
        description="不動産情報ライブラリAPIから駅ごとの災害リスクデータを取得・スコア化する"
    )
    parser.add_argument(
        "--station-id",
        type=str,
        default=None,
        help="特定の駅IDのみ処理（省略時は全駅）",
    )
    parser.add_argument(
        "--radius",
        type=float,
        default=STATION_RADIUS_M,
        help=f"検索半径（メートル、デフォルト: {STATION_RADIUS_M}m）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="DB書き込みを行わずに処理結果を表示",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="hazard_data に既存の駅をスキップして途中再開",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="処理件数制限（デバッグ用）",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを出力",
    )
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if not REINFOLIB_API_KEY:
        logger.error("REINFOLIB_API_KEY が設定されていません。.env を確認してください。")
        sys.exit(1)

    logger.info("=== 災害リスクデータ取得開始 ===")

    # 1. stations テーブルから全駅を取得
    logger.info("Step 1: 駅データ取得中...")
    if args.station_id:
        client = get_client()
        result = (
            client.table("stations")
            .select("id,name,name_en,lat,lng")
            .eq("id", args.station_id)
            .execute()
        )
        stations = result.data or []
    else:
        stations = select_all("stations", "id,name,name_en,lat,lng")

    if not stations:
        logger.error("駅データが見つかりません")
        return

    # lat/lng 欠損を除外
    valid_stations = [s for s in stations if s.get("lat") and s.get("lng")]
    if len(valid_stations) < len(stations):
        logger.warning(
            "位置情報なし: %d 駅をスキップ", len(stations) - len(valid_stations)
        )

    # レジューム: 既存データのある駅をスキップ
    if args.resume:
        existing = select_all("hazard_data", "station_id")
        existing_ids = {r["station_id"] for r in existing}
        before = len(valid_stations)
        valid_stations = [s for s in valid_stations if s["id"] not in existing_ids]
        logger.info(
            "レジューム: %d 駅済み → 残り %d 駅",
            before - len(valid_stations), len(valid_stations),
        )
        if not valid_stations:
            logger.info("全駅処理済みです")
            return

    if args.limit:
        valid_stations = valid_stations[: args.limit]

    logger.info("対象駅数: %d", len(valid_stations))

    # 2. 各駅の災害リスク取得 + スコア算出
    logger.info("Step 2: API 呼び出し + スコア算出中...")
    records = []
    batch_size = 50

    for i, station in enumerate(valid_stations):
        logger.info(
            "  [%d/%d] %s (%.4f, %.4f)...",
            i + 1, len(valid_stations),
            station["name"], station["lat"], station["lng"],
        )

        hazard = fetch_station_hazard(
            REINFOLIB_API_KEY, station["lat"], station["lng"], args.radius
        )

        # スコア算出
        total, flood_score, landslide_score, tsunami_score, liquefaction_score = (
            calculate_hazard_score(
                flood_depth=hazard["flood_depth"],
                landslide_warning=hazard["landslide_warning"],
                landslide_special=hazard["landslide_special"],
                tsunami_depth=hazard["tsunami_depth"],
                liquefaction_risk=hazard["liquefaction_risk"],
            )
        )

        record = {
            "station_id": station["id"],
            "flood_depth": hazard["flood_depth"],
            "flood_level": classify_flood_level(hazard["flood_depth"]),
            "flood_score": flood_score,
            "landslide_warning": hazard["landslide_warning"],
            "landslide_special": hazard["landslide_special"],
            "landslide_score": landslide_score,
            "tsunami_depth": hazard["tsunami_depth"],
            "tsunami_level": classify_tsunami_level(hazard["tsunami_depth"]),
            "tsunami_score": tsunami_score,
            "liquefaction_risk": hazard["liquefaction_risk"],
            "liquefaction_score": liquefaction_score,
            "score": total,
        }
        records.append(record)

        # バッチ UPSERT（中断しても処理済み分は残る）
        if len(records) >= batch_size:
            if args.dry_run:
                logger.info("[DRY RUN] %d 件（DB書き込みスキップ）", len(records))
                for r in records[:5]:
                    logger.info(
                        "    station_id=%s | score=%.1f | 洪水=%s 土砂W=%s 津波=%s 液状=%s",
                        r["station_id"], r["score"],
                        r["flood_level"], r["landslide_warning"],
                        r["tsunami_level"], r["liquefaction_risk"],
                    )
            else:
                upsert_records("hazard_data", records, on_conflict="station_id")
            records = []

    # 残りのレコードを処理
    if records:
        if args.dry_run:
            logger.info("[DRY RUN] 残り %d 件（DB書き込みスキップ）", len(records))
        else:
            upsert_records("hazard_data", records, on_conflict="station_id")

    logger.info("=== 災害リスクデータ取得完了 ===")


if __name__ == "__main__":
    main()
