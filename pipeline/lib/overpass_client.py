"""
Overpass API クライアント
エリア周辺の施設数を OpenStreetMap 経由でカウント

2つの取得モード:
- バッチモード: 少数（~100件以下）の地点を個別クエリ（駅向け）
- 一括モード: 大量（~1000件以上）の地点をbbox一括取得+ローカル割り当て（丁目向け）
"""

import logging
import math
import time

import numpy as np
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
_BULK_TIMEOUT = 180  # 一括クエリ用（大きいレスポンス対応）
_BATCH_SIZE = 10  # バッチモードの1クエリあたりの駅数
_BATCH_DELAY = 5  # バッチ間の待機秒数

# 一括モードの閾値（無効化: バッチモードのみ使用）
_BULK_THRESHOLD = 999999


def _zero_counts():
    return {
        "restaurant_count": 0,
        "convenience_store_count": 0,
        "park_count": 0,
        "school_count": 0,
        "hospital_count": 0,
    }


# ── 共通ユーティリティ ────────────────────────────────


def _execute_query(query, endpoint_idx=0, timeout=None):
    """
    Overpass クエリを実行（エンドポイントローテーション + リトライ）。
    """
    if timeout is None:
        timeout = _REQUEST_TIMEOUT

    for attempt in range(_MAX_RETRIES):
        ep_idx = (endpoint_idx + attempt) % len(_ENDPOINTS)
        url = _ENDPOINTS[ep_idx]

        try:
            resp = requests.post(
                url, data={"data": query}, timeout=timeout
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


def _get_element_coords(el):
    """Overpass 要素から座標を取得"""
    if "center" in el:
        return el["center"]["lat"], el["center"]["lon"]
    elif "lat" in el and "lon" in el:
        return el["lat"], el["lon"]
    return None, None


def _classify_element(el):
    """Overpass 要素を施設カテゴリに分類"""
    tags = el.get("tags", {})
    amenity = tags.get("amenity", "")
    if amenity in ("restaurant", "fast_food", "cafe"):
        return "restaurant_count"
    if tags.get("shop") == "convenience":
        return "convenience_store_count"
    if tags.get("leisure") == "park":
        return "park_count"
    if amenity == "school":
        return "school_count"
    if amenity in ("hospital", "clinic"):
        return "hospital_count"
    return None


# ── 一括モード（大量地点向け）──────────────────────────


def _build_bulk_query(bbox, timeout=180):
    """
    バウンディングボックス内の全施設を取得するクエリ。
    338回の個別クエリの代わりに1回で全施設を取得する。
    """
    s, w, n, e = bbox
    return (
        f"[out:json][timeout:{timeout}][bbox:{s},{w},{n},{e}];\n"
        "(\n"
        '  nw["amenity"~"^(restaurant|fast_food|cafe|school|hospital|clinic)$"];\n'
        '  nw["shop"="convenience"];\n'
        '  nw["leisure"="park"];\n'
        ");\n"
        "out center tags;"
    )


def _assign_facilities_vectorized(stations, elements, radius_m):
    """
    numpy ベクトル演算で各施設を最寄りエリアに割り当て。

    計算量: O(施設数 × エリア数) だが numpy で高速化されるため
    100K施設 × 5Kエリア でも数十秒で完了する。
    """
    results = [_zero_counts() for _ in stations]

    # 施設をパース
    fac_lats = []
    fac_lngs = []
    fac_types = []
    for el in elements:
        lat, lng = _get_element_coords(el)
        ftype = _classify_element(el)
        if lat is None or ftype is None:
            continue
        fac_lats.append(lat)
        fac_lngs.append(lng)
        fac_types.append(ftype)

    if not fac_lats:
        return results

    num_facilities = len(fac_lats)
    logger.info("施設データ: %d 件を %d エリアに割り当て中...", num_facilities, len(stations))

    # エリア座標をラジアンに変換
    area_lats_rad = np.radians([s["lat"] for s in stations])
    area_lngs_rad = np.radians([s["lng"] for s in stations])
    cos_area_lats = np.cos(area_lats_rad)

    R = 6371000.0

    # チャンク処理（メモリ効率のため）
    chunk_size = 5000
    assigned = 0

    for chunk_start in range(0, num_facilities, chunk_size):
        chunk_end = min(chunk_start + chunk_size, num_facilities)

        for i in range(chunk_start, chunk_end):
            flat = math.radians(fac_lats[i])
            flng = math.radians(fac_lngs[i])

            dlat = flat - area_lats_rad
            dlng = flng - area_lngs_rad
            a = (
                np.sin(dlat / 2) ** 2
                + math.cos(flat) * cos_area_lats * np.sin(dlng / 2) ** 2
            )
            distances = R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

            min_idx = int(np.argmin(distances))
            if distances[min_idx] <= radius_m:
                results[min_idx][fac_types[i]] += 1
                assigned += 1

        if chunk_end % 20000 == 0 or chunk_end == num_facilities:
            logger.info(
                "  割り当て進捗: %d / %d 施設 (%d 件割り当て済み)",
                chunk_end, num_facilities, assigned,
            )

    logger.info("施設割り当て完了: %d / %d 件", assigned, num_facilities)
    return results


def _fetch_bulk(stations, radius_m):
    """
    一括取得モード:
    1. 全地点のbboxを算出（+ radius分のパディング）
    2. bbox内の全施設を1クエリで取得
    3. numpy で各施設を最寄り地点に割り当て
    """
    # bbox 算出（radius 分のパディングを追加）
    lats = [s["lat"] for s in stations]
    lngs = [s["lng"] for s in stations]
    pad_deg = radius_m / 111000  # メートル→度の近似変換

    bbox = (
        min(lats) - pad_deg,
        min(lngs) - pad_deg,
        max(lats) + pad_deg,
        max(lngs) + pad_deg,
    )

    logger.info(
        "一括取得モード: bbox=(%.3f,%.3f,%.3f,%.3f), %d 地点",
        *bbox, len(stations),
    )

    # 全施設を一括取得
    query = _build_bulk_query(bbox, timeout=180)
    data = _execute_query(query, endpoint_idx=0, timeout=_BULK_TIMEOUT)

    if data is None:
        logger.error("一括クエリ失敗 — 全エリアゼロを返します")
        return [_zero_counts() for _ in stations]

    elements = data.get("elements", [])
    logger.info("一括取得完了: %d 施設", len(elements))

    # 各施設を最寄りエリアに割り当て
    return _assign_facilities_vectorized(stations, elements, radius_m)


# ── バッチモード（少数地点向け、後方互換）─────────────────


def _build_batch_query(stations_batch, radius_m):
    """
    複数駅を1つの Overpass クエリにまとめる。
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


def _assign_elements_to_stations(elements, stations_batch, radius_m):
    """レスポンスの各要素を最寄り駅に帰属させてカウント。"""
    results = [_zero_counts() for _ in stations_batch]

    for el in elements:
        elat, elng = _get_element_coords(el)
        ftype = _classify_element(el)
        if elat is None or ftype is None:
            continue

        min_dist = float("inf")
        nearest_idx = -1
        for idx, s in enumerate(stations_batch):
            d = _haversine_m(elat, elng, s["lat"], s["lng"])
            if d < min_dist and d <= radius_m:
                min_dist = d
                nearest_idx = idx

        if nearest_idx >= 0:
            results[nearest_idx][ftype] += 1

    return results


def _fetch_batch_sequential(stations, radius_m):
    """バッチモード: 少数地点を個別クエリで取得（従来方式）"""
    total = len(stations)
    num_batches = math.ceil(total / _BATCH_SIZE)
    logger.info(
        "バッチ取得モード: %d地点 → %dバッチ (各%d地点, %ds間隔)",
        total, num_batches, _BATCH_SIZE, _BATCH_DELAY,
    )

    all_results = []
    for batch_idx in range(num_batches):
        start = batch_idx * _BATCH_SIZE
        end = min(start + _BATCH_SIZE, total)
        batch = stations[start:end]

        if batch_idx > 0:
            time.sleep(_BATCH_DELAY)

        ep_idx = batch_idx % len(_ENDPOINTS)
        query = _build_batch_query(batch, radius_m)
        data = _execute_query(query, ep_idx)

        if data is None:
            logger.warning("バッチクエリ失敗 (%d駅) — ゼロを返します", len(batch))
            all_results.extend([_zero_counts() for _ in batch])
        else:
            elements = data.get("elements", [])
            all_results.extend(
                _assign_elements_to_stations(elements, batch, radius_m)
            )

        processed = start + len(batch)
        if (batch_idx + 1) % 5 == 0 or processed == total:
            logger.info(
                "Overpass 進捗: %d / %d 地点 (バッチ %d/%d)",
                processed, total, batch_idx + 1, num_batches,
            )

    return all_results


# ── 公開 API ─────────────────────────────────────────


def fetch_station_facilities(lat, lng, radius_m=STATION_RADIUS_M):
    """単一駅の施設数を取得（後方互換）"""
    batch = [{"lat": lat, "lng": lng}]
    results = _fetch_batch_sequential(batch, radius_m)
    return results[0]


def fetch_batch_facilities(stations_batch, radius_m=STATION_RADIUS_M, endpoint_idx=0):
    """バッチ内の複数駅の施設数を1クエリで取得（後方互換）"""
    query = _build_batch_query(stations_batch, radius_m)
    data = _execute_query(query, endpoint_idx)

    if data is None:
        logger.warning("バッチクエリ失敗 (%d駅) — 全駅ゼロを返します", len(stations_batch))
        return [_zero_counts() for _ in stations_batch]

    elements = data.get("elements", [])
    return _assign_elements_to_stations(elements, stations_batch, radius_m)


def fetch_all_stations_facilities(stations, radius_m=STATION_RADIUS_M):
    """
    全地点の施設数を取得。

    地点数に応じて自動的にモードを切り替え:
    - 100件以下: バッチモード（個別クエリ、駅向け）
    - 100件超: 一括モード（bbox一括取得、丁目向け）

    Args:
        stations: [{"lat": float, "lng": float, ...}, ...] のリスト
        radius_m: 検索半径（メートル）

    Returns:
        施設カウント dict のリスト（stations と同じ順序）
    """
    if len(stations) <= _BULK_THRESHOLD:
        return _fetch_batch_sequential(stations, radius_m)
    return _fetch_bulk(stations, radius_m)
