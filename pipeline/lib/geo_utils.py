"""
地理計算ユーティリティ
GMLパース、逆ジオコーディング、近傍検索
"""

import logging
import xml.etree.ElementTree as ET
from typing import Any

logger = logging.getLogger(__name__)


def parse_gml_stations(gml_path: str, prefecture_code: str = "13") -> list[dict[str, Any]]:
    """
    国土数値情報 GML ファイルから駅データをパース

    Args:
        gml_path: GML ファイルのパス
        prefecture_code: 都道府県コード（デフォルト: 13 = 東京都）

    Returns:
        駅データのリスト [{'name': str, 'name_en': str, 'lat': float, 'lng': float, 'lines': list[str]}, ...]
    """
    # TODO: 実際のGMLパースロジックを実装
    # 国土数値情報の駅データ（N02）のGMLフォーマットに対応
    logger.info("GML ファイルをパース中: %s (都道府県コード: %s)", gml_path, prefecture_code)

    stations: list[dict[str, Any]] = []

    try:
        tree = ET.parse(gml_path)
        root = tree.getroot()
        # TODO: GML の名前空間を考慮したパースロジック
        logger.info("パース完了: %d 駅を検出", len(stations))
    except FileNotFoundError:
        logger.error("GML ファイルが見つかりません: %s", gml_path)
    except ET.ParseError as e:
        logger.error("GML パースエラー: %s", e)

    return stations


def find_municipality(lat: float, lng: float, boundaries_path: str) -> tuple[str, str]:
    """
    緯度経度から区市町村コード・名前を逆ジオコーディング

    Args:
        lat: 緯度
        lng: 経度
        boundaries_path: 行政区域ポリゴンのファイルパス（GeoJSON/Shapefile）

    Returns:
        (municipality_code, municipality_name) のタプル
    """
    # TODO: GeoPandas + Shapely で逆ジオコーディングを実装
    logger.info("逆ジオコーディング: (%f, %f)", lat, lng)

    # プレースホルダー
    return ("", "")


def get_nearby_towns(lat: float, lng: float, radius_m: float = 1000) -> list[str]:
    """
    指定座標から半径 N メートル以内の町丁目名を取得

    Args:
        lat: 緯度
        lng: 経度
        radius_m: 検索半径（メートル、デフォルト: 1000m）

    Returns:
        町丁目名のリスト
    """
    # TODO: 行政区域データと空間検索を実装
    logger.info("近傍町丁目を検索: (%f, %f), 半径 %fm", lat, lng, radius_m)

    return []
