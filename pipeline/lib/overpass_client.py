"""
Overpass API クライアント
駅周辺の施設数を OpenStreetMap 経由でカウント

バッチクエリ + エンドポイントローテーションで
429/504 エラーを回避する。
"""

import logging
import math
import time

import requests

from config.settings import STATION_RADIUS_M

logger = logging.getLogger(__name__)

# エンドポイントローテーション（独立したレートリミット）
_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

_MAX_RETRIES = 5
_REQUEST_TIMEOUT = 120
_BATCH_SIZE = 10  # 1クエリあたりの駅数
_BATCH_DELAY = 5  # バッチ間の待機秒数


def _zero_counts():
    return {
        "restaurant_count": 0,
        "convenience_store_count": 0,
        "park_count": 0,
        "school_count": 0,
        "hospital_count": 0,
    }


def _build_batch_query(stations_batch, radius_m):
    """
    複数駅を1つの Overpass クエリにまとめる。

    各駅に一意の識別タグ（_station_idx）を付けて結果を分離するのは
    Overpass QL では不可能なので、施設の座標から最寄り駅に帰属させる。
    """
    r = int(radius_m)
    around_clauses = []
    for s in stations_batch:
        around_clauses.append(
            f'  nw["amenity"~"^(restaurant|fast_food|cafe|school|hospital|clinic)$"]'
            f"(around:{r},{s['lat']},{s['lng']});\n"
            f'  nw["shop"="convenience"](around:{r},{s["lat"]},{s["lng"]});\n'
            f'  nw["leisure"="park"](around:{r},{s["lat"]},{s["lng"]});'
        )
    body = "\n".join(around_clauses)
    return f"[out:json][timeout:90];\n(\n{body}\n);\nout center tags;"


def _haversine_m(lat1, lng1, lat2, lng2):
    """2点間の距離をメートルで算出"""
    R = 6371000
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _assign_elements_to_stations(elements, stations_batch, radius_m):
    """
    レスポンスの各要素を最寄り駅に帰属させてカウント。
    """
    results = [_zero_counts() for _ in stations_batch]

    for el in elements:
        tags = el.get("tags", {})
        amenity = tags.get("amenity", "")
        shop = tags.get("shop", "")
        leisure = tags.get("leisure", "")

        # 要素の座標を取得（center か直接の lat/lon）
        if "center" in el:
            elat, elng = el["center"]["lat"], el["center"]["lon"]
        elif "lat" in el and "lon" in el:
            elat, elng = el["lat"], el["lon"]
        else:
            continue

        # 最寄り駅を探す
        min_dist = float("inf")
        nearest_idx = -1
        for idx, s in enumerate(stations_batch):
            d = _haversine_m(elat, elng, s["lat"], s["lng"])
            if d < min_dist and d <= radius_m:
                min_dist = d
                nearest_idx = idx

        if nearest_idx < 0:
            continue

        counts = results[nearest_idx]
        if amenity in ("restaurant", "fast_food", "cafe"):
            counts["restaurant_count"] += 1
        elif shop == "convenience":
            counts["convenience_store_count"] += 1
        elif leisure == "park":
            counts["park_count"] += 1
        elif amenity == "school":
            counts["school_count"] += 1
        elif amenity in ("hospital", "clinic"):
            counts["hospital_count"] += 1

    return results


def _execute_query(query, endpoint_idx=0):
    """
    Overpass クエリを実行（エンドポイントローテーション + リトライ）。
    """
    for attempt in range(_MAX_RETRIES):
        ep_idx = (endpoint_idx + attempt) % len(_ENDPOINTS)
        url = _ENDPOINTS[ep_idx]

        try:
            resp = requests.post(
                url, data={"data": query}, timeout=_REQUEST_TIMEOUT
            )
            if resp.status_code in (429, 504):
                wait = 20 * (attempt + 1)
                logger.warning(
                    "Overpass %d [%s] — %ds後にリトライ %d/%d (次のサーバーへ)",
                    resp.status_code,
                    url.split("//")[1].split("/")[0],
                    wait,
                    attempt + 1,
                    _MAX_RETRIES,
                )
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            if attempt == _MAX_RETRIES - 1:
                logger.error("Overpass API 全リトライ失敗: %s", e)
                return None
            wait = 15 * (attempt + 1)
            logger.warning(
                "リトライ %d/%d (%ds後): %s",
                attempt + 1,
                _MAX_RETRIES,
                wait,
                e,
            )
            time.sleep(wait)

    return None


def fetch_station_facilities(lat, lng, radius_m=STATION_RADIUS_M):
    """単一駅の施設数を取得（後方互換）"""
    batch = [{"lat": lat, "lng": lng}]
    results = fetch_batch_facilities(batch, radius_m, endpoint_idx=0)
    return results[0]


def fetch_batch_facilities(stations_batch, radius_m=STATION_RADIUS_M, endpoint_idx=0):
    """
    バッチ内の複数駅の施設数を1クエリで取得。

    Returns:
        施設カウント dict のリスト（stations_batch と同じ順序）
    """
    query = _build_batch_query(stations_batch, radius_m)
    data = _execute_query(query, endpoint_idx)

    if data is None:
        logger.warning("バッチクエリ失敗 (%d駅) — 全駅ゼロを返します", len(stations_batch))
        return [_zero_counts() for _ in stations_batch]

    elements = data.get("elements", [])
    return _assign_elements_to_stations(elements, stations_batch, radius_m)


def fetch_all_stations_facilities(stations, radius_m=STATION_RADIUS_M):
    """
    全駅の施設数をバッチ取得。

    Args:
        stations: [{"lat": float, "lng": float, ...}, ...] のリスト
        radius_m: 検索半径（メートル）

    Returns:
        施設カウント dict のリスト（stations と同じ順序）
    """
    total = len(stations)
    num_batches = math.ceil(total / _BATCH_SIZE)
    logger.info(
        "Overpass バッチ取得開始: %d駅 → %dバッチ (各%d駅, %ds間隔)",
        total,
        num_batches,
        _BATCH_SIZE,
        _BATCH_DELAY,
    )

    all_results = []

    for batch_idx in range(num_batches):
        start = batch_idx * _BATCH_SIZE
        end = min(start + _BATCH_SIZE, total)
        batch = stations[start:end]

        if batch_idx > 0:
            time.sleep(_BATCH_DELAY)

        # エンドポイントをバッチごとにローテーション
        ep_idx = batch_idx % len(_ENDPOINTS)

        batch_results = fetch_batch_facilities(batch, radius_m, ep_idx)
        all_results.extend(batch_results)

        processed = start + len(batch)
        if (batch_idx + 1) % 5 == 0 or processed == total:
            logger.info(
                "Overpass 進捗: %d / %d 駅 (バッチ %d/%d)",
                processed,
                total,
                batch_idx + 1,
                num_batches,
            )

    return all_results
