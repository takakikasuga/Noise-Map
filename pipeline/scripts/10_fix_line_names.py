#!/usr/bin/env python3
"""
路線名曖昧さ解消（ワンタイム）。

GeoJSON を再パースし、曖昧な路線名（"本線" "新宿線" 等）に
運営会社プレフィクスを付与した新名を算出。
DB の stations.lines 配列を UPDATE する。

対象テーブル: stations
更新頻度: ワンタイム（geo_utils.py の修正後に実行）
"""

import argparse
import json
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.geo_utils import (
    TOKYO_BBOX,
    _AMBIGUOUS_LINES,
    disambiguate_line_name,
)
from lib.supabase_client import get_client, select_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

DEFAULT_GEOJSON = str(
    Path(__file__).resolve().parent.parent
    / "data"
    / "raw"
    / "transportation"
    / "N02-22_GML"
    / "UTF-8"
    / "N02-22_Station.geojson"
)


def _build_line_rename_map(geojson_path: str) -> dict[str, dict[str, str]]:
    """
    GeoJSON をパースし、(group_code) ごとに 旧路線名→新路線名 のマッピングを構築。

    Returns:
        {group_code: {旧名: 新名, ...}, ...}
    """
    with open(geojson_path, encoding="utf-8") as f:
        data = json.load(f)

    # group_code ごとに (旧名, 新名) を収集
    rename_by_group: dict[str, dict[str, str]] = {}

    for feature in data["features"]:
        props = feature["properties"]
        geom = feature["geometry"]
        coords = geom["coordinates"]

        # 重心を計算
        if geom["type"] == "LineString":
            lat = sum(c[1] for c in coords) / len(coords)
            lng = sum(c[0] for c in coords) / len(coords)
        elif geom["type"] == "Point":
            lng, lat = coords[0], coords[1]
        else:
            continue

        # バウンディングボックスで粗くフィルタ
        if not (
            TOKYO_BBOX["lat_min"] <= lat <= TOKYO_BBOX["lat_max"]
            and TOKYO_BBOX["lon_min"] <= lng <= TOKYO_BBOX["lon_max"]
        ):
            continue

        group_code = props.get("N02_005g") or props.get("N02_005c", "")
        line_name = props.get("N02_003", "")
        operator = props.get("N02_004", "")

        if not group_code or not line_name:
            continue

        # 曖昧な路線名のみ処理
        if line_name not in _AMBIGUOUS_LINES:
            continue

        new_name = disambiguate_line_name(line_name, operator)
        if new_name != line_name:
            rename_by_group.setdefault(group_code, {})[line_name] = new_name

    return rename_by_group


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--geojson-path",
        type=str,
        default=DEFAULT_GEOJSON,
        help="駅データ GeoJSON ファイルのパス",
    )
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
    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("=== 路線名曖昧さ解消開始 ===")

    # 1. GeoJSON から路線名リネームマップを構築
    logger.info("Step 1: GeoJSON パース中: %s", args.geojson_path)
    rename_by_group = _build_line_rename_map(args.geojson_path)
    logger.info("曖昧路線を含む group_code: %d 件", len(rename_by_group))

    # 全リネーム対をログ出力
    all_renames: dict[str, str] = {}
    for group_renames in rename_by_group.values():
        all_renames.update(group_renames)
    for old_name, new_name in sorted(all_renames.items()):
        logger.info("  %s → %s", old_name, new_name)

    if not rename_by_group:
        logger.info("リネーム対象なし。処理終了。")
        return

    # 2. DB の stations を取得
    logger.info("Step 2: stations テーブル取得中...")
    stations = select_all("stations", "id,name,lines")
    logger.info("stations: %d 件", len(stations))

    # 3. 各駅の lines 配列を更新
    updates = []
    for station in stations:
        old_lines = station.get("lines", []) or []
        new_lines = []
        changed = False

        for line in old_lines:
            if line in all_renames:
                new_lines.append(all_renames[line])
                changed = True
            else:
                new_lines.append(line)

        if changed:
            updates.append({
                "id": station["id"],
                "name": station["name"],
                "old_lines": old_lines,
                "new_lines": new_lines,
            })

    logger.info("更新対象: %d 駅", len(updates))

    if not updates:
        logger.info("更新対象なし。処理終了。")
        return

    # 4. プレビュー or 更新
    for u in updates[:30]:
        logger.info(
            "  %s: %s → %s",
            u["name"],
            u["old_lines"],
            u["new_lines"],
        )
    if len(updates) > 30:
        logger.info("  ... 他 %d 件", len(updates) - 30)

    if args.dry_run:
        logger.info("[DRY RUN] DB 更新をスキップ")
    else:
        client = get_client()
        updated = 0
        for u in updates:
            client.table("stations").update(
                {"lines": u["new_lines"]}
            ).eq("id", u["id"]).execute()
            updated += 1
        logger.info("stations: %d 駅の lines を更新しました", updated)

    logger.info("=== 路線名曖昧さ解消完了 ===")


if __name__ == "__main__":
    main()
