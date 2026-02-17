"""
地理計算ユーティリティ
GeoJSONパース、逆ジオコーディング、ローマ字変換
"""

import json
import logging
import re
import time
from pathlib import Path
from typing import Any

import pykakasi
import requests

logger = logging.getLogger(__name__)

# 東京都おおよそのバウンディングボックス（本土のみ）
# 島嶼部（伊豆諸島・小笠原諸島）は緯度が大きく異なるため意図的に除外。
# 島嶼部の駅データは存在しないため、このBBOXで十分。
TOKYO_BBOX = {
    "lat_min": 35.50,
    "lat_max": 35.90,
    "lon_min": 138.85,
    "lon_max": 139.95,
}

# pykakasi インスタンス（モジュールレベルで1回だけ初期化）
_kakasi = pykakasi.kakasi()

# 逆ジオコーディングキャッシュ
_CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "cache"
_GEOCODE_CACHE_FILE = _CACHE_DIR / "geocode_cache.json"

# 東京都 市区町村コード → 名前マッピング
TOKYO_MUNICIPALITIES: dict[str, str] = {
    "13101": "千代田区", "13102": "中央区", "13103": "港区",
    "13104": "新宿区", "13105": "文京区", "13106": "台東区",
    "13107": "墨田区", "13108": "江東区", "13109": "品川区",
    "13110": "目黒区", "13111": "大田区", "13112": "世田谷区",
    "13113": "渋谷区", "13114": "中野区", "13115": "杉並区",
    "13116": "豊島区", "13117": "北区", "13118": "荒川区",
    "13119": "板橋区", "13120": "練馬区", "13121": "足立区",
    "13122": "葛飾区", "13123": "江戸川区",
    "13201": "八王子市", "13202": "立川市", "13203": "武蔵野市",
    "13204": "三鷹市", "13205": "青梅市", "13206": "府中市",
    "13207": "昭島市", "13208": "調布市", "13209": "町田市",
    "13210": "小金井市", "13211": "小平市", "13212": "日野市",
    "13213": "東村山市", "13214": "国分寺市", "13215": "国立市",
    "13218": "福生市", "13219": "狛江市", "13220": "東大和市",
    "13221": "清瀬市", "13222": "東久留米市", "13223": "武蔵村山市",
    "13224": "多摩市", "13225": "稲城市", "13227": "羽村市",
    "13228": "あきる野市", "13229": "西東京市",
    "13303": "瑞穂町", "13305": "日の出町",
    "13307": "檜原村", "13308": "奥多摩町",
}


# 複数社で同名の路線名（曖昧路線名）
_AMBIGUOUS_LINES = {"本線", "新宿線", "池袋線", "東上本線", "大師線", "多摩川線", "多摩線"}

# 運営会社名 → 略称プレフィクス
_OPERATOR_PREFIX = {
    "京王電鉄": "京王",
    "小田急電鉄": "小田急",
    "京浜急行電鉄": "京急",
    "東武鉄道": "東武",
    "西武鉄道": "西武",
    "東京都交通局": "都営",
    "東京急行電鉄": "東急",
    "京成電鉄": "京成",
}


def disambiguate_line_name(line_name: str, operator: str) -> str:
    """曖昧な路線名に運営会社プレフィクスを付与して一意にする。"""
    if line_name in _AMBIGUOUS_LINES and operator:
        prefix = _OPERATOR_PREFIX.get(operator, operator)
        return f"{prefix}{line_name}"
    return line_name


def parse_station_geojson(geojson_path: str) -> list[dict[str, Any]]:
    """
    国土数値情報 駅データ GeoJSON をパースし、東京都エリアの駅候補を抽出。

    N02 フィールド:
        N02_003: 路線名
        N02_005: 駅名
        N02_005g: 駅グループコード（同一駅の複数路線を統合）

    同じ N02_005g を持つ駅は同一物理駅とみなし、路線名を lines[] に集約する。

    Returns:
        [{"name", "lat", "lng", "lines", "group_code"}, ...]
    """
    logger.info("GeoJSON をパース中: %s", geojson_path)

    with open(geojson_path, encoding="utf-8") as f:
        data = json.load(f)

    candidates: dict[str, dict[str, Any]] = {}

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
        station_name = props.get("N02_005", "")
        line_name = props.get("N02_003", "")
        operator = props.get("N02_004", "")

        # 曖昧な路線名に運営会社プレフィクスを付与
        line_name = disambiguate_line_name(line_name, operator)

        if not station_name or not group_code:
            continue

        if group_code in candidates:
            if line_name and line_name not in candidates[group_code]["lines"]:
                candidates[group_code]["lines"].append(line_name)
            # 座標を平均化してより正確な重心に
            n = candidates[group_code]["_count"]
            candidates[group_code]["lat"] = (
                candidates[group_code]["lat"] * n + lat
            ) / (n + 1)
            candidates[group_code]["lng"] = (
                candidates[group_code]["lng"] * n + lng
            ) / (n + 1)
            candidates[group_code]["_count"] = n + 1
        else:
            candidates[group_code] = {
                "name": station_name,
                "lat": lat,
                "lng": lng,
                "lines": [line_name] if line_name else [],
                "group_code": group_code,
                "_count": 1,
            }

    result = []
    for s in candidates.values():
        del s["_count"]
        result.append(s)

    logger.info("バウンディングボックスフィルタ後: %d 駅候補", len(result))
    return result


def romanize_station_name(name: str) -> str:
    """
    日本語の駅名を URL 用ローマ字スラッグに変換。

    例: "新宿" → "shinjuku", "御茶ノ水" → "ochanomizu"
    """
    items = _kakasi.convert(name)
    parts = [item["hepburn"] for item in items if item["hepburn"].strip()]
    slug = "-".join(parts).lower()
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def ensure_unique_slugs(stations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    name_en（ローマ字スラッグ）の一意性を保証。
    重複がある場合は連番を付加する。
    """
    slug_indices: dict[str, list[int]] = {}

    for i, station in enumerate(stations):
        slug = romanize_station_name(station["name"])
        station["name_en"] = slug
        slug_indices.setdefault(slug, []).append(i)

    for slug, indices in slug_indices.items():
        if len(indices) <= 1:
            continue
        logger.warning("スラッグ重複: '%s' (%d 件)", slug, len(indices))
        for seq, idx in enumerate(indices):
            if seq == 0:
                continue
            stations[idx]["name_en"] = f"{slug}-{seq + 1}"

    return stations


# ── 逆ジオコーディング ──────────────────────────────────


def _load_geocode_cache() -> dict[str, dict[str, str]]:
    if _GEOCODE_CACHE_FILE.exists():
        with open(_GEOCODE_CACHE_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_geocode_cache(cache: dict[str, dict[str, str]]) -> None:
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(_GEOCODE_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False, indent=2)


def _reverse_geocode_gsi(lat: float, lng: float) -> tuple[str, str]:
    """
    国土地理院 逆ジオコーディング API で市区町村コード・名前を取得。
    失敗時は ("", "") を返す。
    """
    url = "https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress"
    for attempt in range(3):
        try:
            resp = requests.get(
                url, params={"lat": lat, "lon": lng}, timeout=10
            )
            resp.raise_for_status()
            results = resp.json().get("results", {})
            return results.get("muniCd", ""), results.get("lv01Nm", "")
        except requests.RequestException as e:
            if attempt == 2:
                logger.warning("逆ジオコーディング失敗 (%f, %f): %s", lat, lng, e)
                return "", ""
            wait = 2**attempt
            logger.debug("リトライ %d/3 (%ds後): %s", attempt + 1, wait, e)
            time.sleep(wait)
    return "", ""


def batch_reverse_geocode(
    stations: list[dict[str, Any]],
    delay: float = 0.1,
) -> list[dict[str, Any]]:
    """
    駅リストに市区町村情報を付与（キャッシュ付き）。
    東京都（市区町村コードが "13" 始まり）以外の駅は除外する。
    """
    cache = _load_geocode_cache()
    result = []
    new_entries = 0

    for i, station in enumerate(stations):
        cache_key = f"{station['lat']:.4f}_{station['lng']:.4f}"

        if cache_key in cache:
            code = cache[cache_key]["code"]
            name = cache[cache_key]["name"]
        else:
            code, name = _reverse_geocode_gsi(station["lat"], station["lng"])
            cache[cache_key] = {"code": code, "name": name}
            new_entries += 1
            time.sleep(delay)

        if not code.startswith("13"):
            logger.debug(
                "東京都外のためスキップ: %s (code=%s, %s)",
                station["name"], code, name,
            )
            continue

        station["municipality_code"] = code
        station["municipality_name"] = TOKYO_MUNICIPALITIES.get(code, name)
        result.append(station)

        if (i + 1) % 100 == 0:
            logger.info("逆ジオコーディング進捗: %d / %d", i + 1, len(stations))

    if new_entries > 0:
        _save_geocode_cache(cache)
        logger.info("キャッシュに %d 件追加（合計 %d 件）", new_entries, len(cache))

    logger.info("東京都の駅: %d / %d 候補", len(result), len(stations))
    return result


# ── 順ジオコーディング（住所 → 座標） ──────────────────


def forward_geocode_gsi(address: str) -> tuple[float, float] | None:
    """
    GSI（国土地理院）住所検索 API で住所から緯度・経度を取得。

    Args:
        address: 検索する住所文字列（例: "東京都千代田区一番町"）

    Returns:
        (lat, lng) or None
    """
    url = "https://msearch.gsi.go.jp/address-search/AddressSearch"
    for attempt in range(3):
        try:
            resp = requests.get(url, params={"q": address}, timeout=10)
            resp.raise_for_status()
            results = resp.json()
            if results and len(results) > 0:
                coords = results[0].get("geometry", {}).get("coordinates")
                if coords and len(coords) == 2:
                    lng, lat = coords[0], coords[1]
                    return lat, lng
            return None
        except requests.RequestException as e:
            if attempt == 2:
                logger.debug("順ジオコーディング失敗 (%s): %s", address, e)
                return None
            wait = 2 ** attempt
            time.sleep(wait)
    return None


# ── 後方互換（他スクリプトから参照される可能性） ──────────


def get_nearby_towns(lat: float, lng: float, radius_m: float = 1000) -> list[str]:
    """指定座標から半径 N メートル以内の町丁目名を取得（未実装）"""
    logger.info("近傍町丁目を検索: (%f, %f), 半径 %fm", lat, lng, radius_m)
    return []
