"""
04_fetch_vibe.py - 雰囲気データ取得

e-Stat API（国勢調査等）と Overpass API（OpenStreetMap）を使用して、
各駅周辺の人口構成・施設数を取得し、タグを自動生成して
vibe_data テーブルに INSERT する。

データソース:
  - e-Stat API（政府統計の総合窓口）
    https://www.e-stat.go.jp/api/
  - Overpass API（OpenStreetMap）
    https://overpass-api.de/

実行方法:
  python scripts/04_fetch_vibe.py
"""

import argparse
import logging
import sys

sys.path.insert(0, ".")

from lib.supabase_client import upsert_records, select_all
from lib.normalizer import generate_vibe_tags
from config.settings import ESTAT_API_KEY, STATION_RADIUS_M

logger = logging.getLogger(__name__)


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description="e-Stat API + Overpass API から駅ごとの雰囲気データを取得・タグ生成する"
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
        "--verbose", "-v",
        action="store_true",
        help="詳細ログを出力",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    logger.info("=== 雰囲気データ取得開始 ===")

    # TODO: 以下の処理を実装
    # 1. stations テーブルから全駅を取得
    # 2. e-Stat API で人口構成データを取得
    #    - 年齢別人口比率
    #    - 世帯構成
    #    - 昼夜間人口比率
    # 3. Overpass API で周辺施設数を取得
    #    - 飲食店、コンビニ、公園、学校、病院
    # 4. generate_vibe_tags でタグを自動生成
    # 5. vibe_data テーブルに UPSERT

    logger.info("=== 雰囲気データ取得完了 ===")


if __name__ == "__main__":
    main()
