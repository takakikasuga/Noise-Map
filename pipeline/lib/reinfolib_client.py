"""
不動産情報ライブラリ API クライアント

各駅周辺の洪水・土砂・津波・液状化リスク情報を取得する。

API ドキュメント: https://www.reinfolib.mlit.go.jp/
"""

import logging
import math
import time
from typing import Any, Optional

import requests
from shapely.geometry import Point, shape

logger = logging.getLogger(__name__)

# API ベース URL
_BASE_URL = "https://www.reinfolib.mlit.go.jp/ex-api/external"

# レート制限: リクエスト間隔（秒）
_REQUEST_DELAY = 0.5

# リトライ設定
_MAX_RETRIES = 3

# デフォルト ズームレベル（不動産情報ライブラリ API の推奨値）
_DEFAULT_ZOOM = 15

# タイルサイズ（Web Mercator）
_TILE_SIZE = 256


def lat_lng_to_tile(lat: float, lng: float, zoom: int) -> tuple[int, int]:
    """
    緯度経度をWeb Mercatorタイル座標(x, y)に変換。

    Args:
        lat: 緯度
        lng: 経度
        zoom: ズームレベル

    Returns:
        (tile_x, tile_y)
    """
    n = 2 ** zoom
    x = int((lng + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    return x, y


def get_covering_tiles(
    lat: float, lng: float, radius_m: float, zoom: int = _DEFAULT_ZOOM
) -> list[tuple[int, int]]:
    """
    指定座標から半径 radius_m 以内をカバーするタイル一覧を返す。

    Args:
        lat: 中心緯度
        lng: 中心経度
        radius_m: 半径（メートル）
        zoom: ズームレベル

    Returns:
        [(tile_x, tile_y), ...]
    """
    # メートル → 度への概算変換（東京付近）
    lat_deg = radius_m / 111_320
    lng_deg = radius_m / (111_320 * math.cos(math.radians(lat)))

    corners = [
        (lat + lat_deg, lng - lng_deg),  # NW
        (lat + lat_deg, lng + lng_deg),  # NE
        (lat - lat_deg, lng - lng_deg),  # SW
        (lat - lat_deg, lng + lng_deg),  # SE
    ]

    tiles = set()
    for c_lat, c_lng in corners:
        tiles.add(lat_lng_to_tile(c_lat, c_lng, zoom))

    # 中心タイルも確実に含める
    tiles.add(lat_lng_to_tile(lat, lng, zoom))

    return list(tiles)


def _api_request(
    endpoint: str,
    api_key: str,
    z: int,
    x: int,
    y: int,
) -> list[dict[str, Any]]:
    """
    不動産情報ライブラリ API を呼び出し、GeoJSON フィーチャー一覧を返す。
    リトライ（指数バックオフ）付き。
    """
    url = f"{_BASE_URL}/{endpoint}"
    headers = {"Ocp-Apim-Subscription-Key": api_key}
    params = {"response_format": "geojson", "z": z, "x": x, "y": y}

    for attempt in range(_MAX_RETRIES):
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            return data.get("features", [])
        except requests.RequestException as e:
            if attempt == _MAX_RETRIES - 1:
                logger.warning(
                    "API リクエスト失敗 %s (z=%d,x=%d,y=%d): %s",
                    endpoint, z, x, y, e,
                )
                return []
            wait = 2 ** attempt
            logger.debug("リトライ %d/%d (%ds後): %s", attempt + 1, _MAX_RETRIES, wait, e)
            time.sleep(wait)

    return []


def _fetch_features_in_radius(
    endpoint: str,
    api_key: str,
    lat: float,
    lng: float,
    radius_m: float,
    zoom: int = _DEFAULT_ZOOM,
) -> list[dict[str, Any]]:
    """
    指定座標の半径内にあるフィーチャーを全タイルから取得し、
    空間交差判定でフィルタリングして返す。
    """
    center = Point(lng, lat)
    # メートル → 度（概算）でバッファ
    buffer_deg = radius_m / 111_320
    search_area = center.buffer(buffer_deg)

    tiles = get_covering_tiles(lat, lng, radius_m, zoom)
    all_features = []

    for tx, ty in tiles:
        features = _api_request(endpoint, api_key, zoom, tx, ty)
        time.sleep(_REQUEST_DELAY)

        for f in features:
            try:
                geom = shape(f["geometry"])
                if geom.intersects(search_area):
                    all_features.append(f)
            except Exception:
                continue

    return all_features


def fetch_flood_risk(
    api_key: str, lat: float, lng: float, radius_m: float
) -> Optional[float]:
    """
    洪水浸水想定区域を取得し、最大浸水深（メートル）を返す。
    浸水リスクなしの場合は None。

    API: XKT026
    """
    features = _fetch_features_in_radius("XKT026", api_key, lat, lng, radius_m)

    if not features:
        return None

    max_depth = 0.0
    for f in features:
        props = f.get("properties", {})
        # 浸水深は depth_* フィールド or A31_101（ランク）
        depth = props.get("A31_101")
        if depth is not None:
            # ランク値を深さに変換: 1=0.5m未満, 2=0.5-3m, 3=3-5m, 4=5-10m, 5=10m以上
            depth_map = {1: 0.25, 2: 1.75, 3: 4.0, 4: 7.5, 5: 12.0}
            max_depth = max(max_depth, depth_map.get(int(depth), 0))

    return max_depth if max_depth > 0 else None


def fetch_landslide_risk(
    api_key: str, lat: float, lng: float, radius_m: float
) -> tuple[bool, bool]:
    """
    土砂災害警戒区域を取得。

    API: XKT029
    Returns:
        (warning: bool, special_warning: bool)
    """
    features = _fetch_features_in_radius("XKT029", api_key, lat, lng, radius_m)

    warning = False
    special = False

    for f in features:
        props = f.get("properties", {})
        zone_type = props.get("A33_002")
        if zone_type is not None:
            zone_type = int(zone_type)
            if zone_type == 1:
                warning = True
            elif zone_type == 2:
                special = True

    return warning, special


def fetch_tsunami_risk(
    api_key: str, lat: float, lng: float, radius_m: float
) -> Optional[float]:
    """
    津波浸水想定区域を取得し、最大浸水深（メートル）を返す。
    津波リスクなしの場合は None。

    API: XKT028
    """
    features = _fetch_features_in_radius("XKT028", api_key, lat, lng, radius_m)

    if not features:
        return None

    max_depth = 0.0
    for f in features:
        props = f.get("properties", {})
        depth = props.get("A39_002")
        if depth is not None:
            max_depth = max(max_depth, float(depth))

    return max_depth if max_depth > 0 else None


def fetch_liquefaction_risk(
    api_key: str, lat: float, lng: float, radius_m: float
) -> str:
    """
    液状化リスクを取得し、最大リスクレベルを返す。

    API: XKT025
    Returns:
        'low', 'moderate', or 'high'
    """
    features = _fetch_features_in_radius("XKT025", api_key, lat, lng, radius_m)

    if not features:
        return "low"

    # リスクレベルの優先度
    risk_priority = {"low": 0, "moderate": 1, "high": 2}
    max_risk = "low"

    for f in features:
        props = f.get("properties", {})
        risk = props.get("A40_002")
        if risk is not None:
            risk = int(risk)
            # ランク: 1=液状化の可能性が低い, 2=液状化の可能性がある, 3=液状化の可能性が高い
            risk_map = {1: "low", 2: "moderate", 3: "high"}
            level = risk_map.get(risk, "low")
            if risk_priority.get(level, 0) > risk_priority.get(max_risk, 0):
                max_risk = level

    return max_risk


def fetch_station_hazard(
    api_key: str, lat: float, lng: float, radius_m: float
) -> dict[str, Any]:
    """
    4種の災害リスクを統合して取得。

    Returns:
        {
            "flood_depth": float | None,
            "landslide_warning": bool,
            "landslide_special": bool,
            "tsunami_depth": float | None,
            "liquefaction_risk": str,
        }
    """
    flood = fetch_flood_risk(api_key, lat, lng, radius_m)
    warning, special = fetch_landslide_risk(api_key, lat, lng, radius_m)
    tsunami = fetch_tsunami_risk(api_key, lat, lng, radius_m)
    liquefaction = fetch_liquefaction_risk(api_key, lat, lng, radius_m)

    return {
        "flood_depth": flood,
        "landslide_warning": warning,
        "landslide_special": special,
        "tsunami_depth": tsunami,
        "liquefaction_risk": liquefaction,
    }
