"""
e-Stat API クライアント
国勢調査データ（年齢構成・世帯構成・昼夜間人口比）を取得

市区町村レベル: fetch_age_distribution / fetch_household_composition / fetch_daytime_ratio
小地域（町丁字）レベル: fetch_age_distribution_by_area / fetch_household_by_area
統合: fetch_all_estat_data（市区町村）/ fetch_all_estat_area_data（小地域＋市区町村フォールバック）
"""

import logging
import time
from typing import Any, Optional

import requests

from config.settings import ESTAT_API_KEY

logger = logging.getLogger(__name__)

BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"
STATS_LIST_URL = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList"

# Dataset IDs — 市区町村レベル（人口等基本集計）
STATS_AGE_DISTRIBUTION = "0003445162"
STATS_HOUSEHOLD_COMPOSITION = "0003445284"
STATS_DAYTIME_POPULATION = "0003454499"

# Dataset IDs — 小地域集計（国勢調査 令和2年, 東京都）
# getStatsList(searchKind=2, statsCode=00200521, surveyYears=2020, searchWord=東京都) で取得
STATS_AGE_SMALL_AREA: str = "8003006792"       # 年齢（5歳階級、4区分）別、男女別人口 東京都
STATS_HOUSEHOLD_SMALL_AREA: str = "8003006803"  # 世帯人員別一般世帯数 東京都（単身世帯=世帯人員1人）

# 東京都 市区町村コード範囲
AREA_FROM = "13101"
AREA_TO = "13421"

# 小地域用: 東京都全域の 11桁 area コード範囲
SMALL_AREA_FROM = "13101000000"
SMALL_AREA_TO = "13421999999"

# リトライ設定
MAX_RETRIES = 3
RETRY_BASE_DELAY = 2  # seconds


def _fetch_estat_data(
    api_key: str, params: dict[str, str]
) -> list[dict[str, Any]]:
    """
    e-Stat API からデータを取得（ページネーション・リトライ対応）。

    Returns:
        VALUE レコードのリスト
    """
    all_values: list[dict[str, Any]] = []
    base_params = {
        "appId": api_key,
        "limit": "100000",
        **params,
    }

    next_key = None
    page = 1

    while True:
        request_params = {**base_params}
        if next_key:
            request_params["startPosition"] = str(next_key)

        data = None
        for attempt in range(MAX_RETRIES):
            try:
                resp = requests.get(BASE_URL, params=request_params, timeout=60)
                resp.raise_for_status()
                data = resp.json()
                break
            except requests.RequestException as e:
                if attempt == MAX_RETRIES - 1:
                    logger.error(
                        "e-Stat API リクエスト失敗 (statsDataId=%s): %s",
                        params.get("statsDataId", "?"),
                        e,
                    )
                    raise
                wait = RETRY_BASE_DELAY ** (attempt + 1)
                logger.warning(
                    "リトライ %d/%d (%ds後): %s", attempt + 1, MAX_RETRIES, wait, e
                )
                time.sleep(wait)

        stats_data = data.get("GET_STATS_DATA", {}).get("STATISTICAL_DATA", {})
        data_inf = stats_data.get("DATA_INF", {})
        values = data_inf.get("VALUE", [])

        if not values:
            if page == 1:
                logger.warning(
                    "データが空です (statsDataId=%s)",
                    params.get("statsDataId", "?"),
                )
            break

        all_values.extend(values)
        logger.info(
            "ページ %d: %d 件取得 (累計 %d 件)", page, len(values), len(all_values)
        )

        # ページネーション: NEXT_KEY を確認
        result_inf = data.get("GET_STATS_DATA", {}).get("RESULT_INF", {})
        next_key_val = result_inf.get("NEXT_KEY")
        if next_key_val:
            next_key = next_key_val
            page += 1
        else:
            break

    return all_values


def _parse_value(raw: str) -> Optional[float]:
    """値文字列をパース。秘匿値・欠損値は None を返す。"""
    if not raw or raw in ("-", "…", "x", "X", "*", "***"):
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def fetch_age_distribution(api_key: str) -> dict[str, dict]:
    """
    年齢構成データを取得。

    cat03 コード:
        00=総数, 04=15-19歳, 05=20-24歳, 06=25-29歳, 07=30-34歳,
        08=35-39歳, 09=40-44歳, 10=45-49歳, 11=50-54歳, 12=55-59歳,
        13=60-64歳, R3=65歳以上

    Returns:
        {municipality_code: {young_ratio, family_ratio, elderly_ratio, total_population}}
    """
    logger.info("年齢構成データを取得中...")

    values = _fetch_estat_data(api_key, {
        "statsDataId": STATS_AGE_DISTRIBUTION,
        "cdCat01": "0",
        "cdCat02": "0",
        "cdAreaFrom": AREA_FROM,
        "cdAreaTo": AREA_TO,
    })

    # エリア × cat03 で整理
    area_data: dict[str, dict[str, float]] = {}

    for v in values:
        area = v.get("@area", "")
        cat03 = v.get("@cat03", "")
        parsed = _parse_value(v.get("$", ""))

        if not area or parsed is None:
            continue

        area_data.setdefault(area, {})[cat03] = parsed

    # 比率を計算
    young_codes = {"04", "05", "06", "07"}    # 15-34歳
    family_codes = {"08", "09", "10", "11", "12", "13"}  # 35-64歳

    result: dict[str, dict] = {}

    for area, cats in area_data.items():
        total = cats.get("00", 0)
        if total == 0:
            continue

        young = sum(cats.get(c, 0) for c in young_codes)
        family = sum(cats.get(c, 0) for c in family_codes)
        elderly = cats.get("R3", 0)

        result[area] = {
            "young_ratio": round(young / total, 4),
            "family_ratio": round(family / total, 4),
            "elderly_ratio": round(elderly / total, 4),
            "total_population": int(total),
        }

    logger.info("年齢構成データ: %d 市区町村", len(result))
    return result


def fetch_household_composition(api_key: str) -> dict[str, dict]:
    """
    世帯構成データを取得。

    cat01: 0=総数, 3=単独世帯
    cat02: 世帯員の年齢による世帯の種類（総数コードを自動検出）

    Returns:
        {municipality_code: {single_ratio, total_households, single_households}}
    """
    logger.info("世帯構成データを取得中...")

    values = _fetch_estat_data(api_key, {
        "statsDataId": STATS_HOUSEHOLD_COMPOSITION,
        "cdAreaFrom": AREA_FROM,
        "cdAreaTo": AREA_TO,
    })

    # エリア × cat01 × cat02 で整理
    area_data: dict[str, dict[str, dict[str, float]]] = {}

    for v in values:
        area = v.get("@area", "")
        cat01 = v.get("@cat01", "")
        cat02 = v.get("@cat02", "")
        parsed = _parse_value(v.get("$", ""))

        if not area or cat01 not in ("0", "3") or parsed is None:
            continue

        area_data.setdefault(area, {}).setdefault(cat01, {})[cat02] = parsed

    # cat02 の総数コードを自動検出（最初のエリアの cat01=0 から最大値のコードを使用）
    total_cat02: Optional[str] = None
    for area, cats in area_data.items():
        if "0" not in cats:
            continue
        for code in ("0", "00", "000"):
            if code in cats["0"]:
                total_cat02 = code
                break
        if total_cat02:
            break

    if total_cat02 is None:
        # フォールバック: cat01=0 の中で最大値を持つ cat02 コードを使用
        for area, cats in area_data.items():
            if "0" in cats and cats["0"]:
                total_cat02 = max(cats["0"], key=lambda k: cats["0"][k])
                break

    if total_cat02 is None:
        logger.error("世帯構成データの cat02 総数コードを特定できません")
        return {}

    logger.info("世帯構成 cat02 総数コード: %s", total_cat02)

    result: dict[str, dict] = {}

    for area, cats in area_data.items():
        total = cats.get("0", {}).get(total_cat02, 0)
        single = cats.get("3", {}).get(total_cat02, 0)

        if total == 0:
            continue

        result[area] = {
            "single_ratio": round(single / total, 4),
            "total_households": int(total),
            "single_households": int(single),
        }

    logger.info("世帯構成データ: %d 市区町村", len(result))
    return result


def fetch_daytime_ratio(api_key: str) -> dict[str, dict]:
    """
    昼夜間人口比データを取得。

    値はパーセンテージ（例: 1355.39 = 1355%）なので 100 で割って比率に変換。

    Returns:
        {municipality_code: {daytime_ratio}}
    """
    logger.info("昼夜間人口比データを取得中...")

    values = _fetch_estat_data(api_key, {
        "statsDataId": STATS_DAYTIME_POPULATION,
        "cdCat01": "0",
        "cdCat02": "00",
        "cdAreaFrom": AREA_FROM,
        "cdAreaTo": AREA_TO,
    })

    result: dict[str, dict] = {}

    for v in values:
        area = v.get("@area", "")
        parsed = _parse_value(v.get("$", ""))

        if not area or parsed is None:
            continue

        result[area] = {
            "daytime_ratio": round(parsed / 100, 4),
        }

    logger.info("昼夜間人口比データ: %d 市区町村", len(result))
    return result


def fetch_all_estat_data(api_key: Optional[str] = None) -> dict[str, dict]:
    """
    全 e-Stat データを取得し、市区町村コードでマージ。

    Returns:
        {municipality_code: {young_ratio, family_ratio, elderly_ratio,
                              single_ratio, daytime_ratio, ...}}
    """
    if api_key is None:
        api_key = ESTAT_API_KEY

    if not api_key:
        raise ValueError("ESTAT_API_KEY が設定されていません")

    age_data = fetch_age_distribution(api_key)
    household_data = fetch_household_composition(api_key)
    daytime_data = fetch_daytime_ratio(api_key)

    # 市区町村コードでマージ
    all_codes = set(age_data) | set(household_data) | set(daytime_data)
    result: dict[str, dict] = {}

    for code in sorted(all_codes):
        merged: dict[str, Any] = {}
        if code in age_data:
            merged.update(age_data[code])
        if code in household_data:
            merged.update(household_data[code])
        if code in daytime_data:
            merged.update(daytime_data[code])
        result[code] = merged

    logger.info("e-Stat 統合データ: %d 市区町村", len(result))
    return result


# ── 小地域（町丁字）レベル ────────────────────────────────


def fetch_age_distribution_by_area(api_key: str) -> dict[str, dict]:
    """
    小地域（町丁字）レベルの年齢構成データを取得。

    e-Stat 小地域集計 statsDataId=8003006792
    「年齢（5歳階級、4区分）別、男女別人口 東京都」を使用。

    cat01 コード体系（総数のみ使用、男女別は使わない）:
        0010: 総数（年齢不詳含む）
        0020: 0-4歳, 0030: 5-9, 0040: 10-14
        0050: 15-19歳, 0060: 20-24, 0070: 25-29, 0080: 30-34  → young (15-34)
        0090: 35-39, 0100: 40-44, 0110: 45-49, 0120: 50-54,
        0130: 55-59, 0140: 60-64  → family (35-64)
        0150: 65歳以上  → elderly

    @area は 11桁の KEY_CODE（level=4: 丁目レベル）。
    cat02 は秘匿フラグ（1=無し のみ使用）。

    Returns:
        {area_code_11digit: {young_ratio, family_ratio, elderly_ratio, total_population}}
    """
    logger.info("小地域 年齢構成データを取得中 (statsDataId=%s)...", STATS_AGE_SMALL_AREA)
    try:
        values = _fetch_estat_data(api_key, {
            "statsDataId": STATS_AGE_SMALL_AREA,
        })

        area_data: dict[str, dict[str, float]] = {}
        for v in values:
            area = v.get("@area", "")
            # 11桁（丁目レベル）のみ対象、秘匿データは除外
            if len(area) != 11:
                continue
            cat02 = v.get("@cat02", "")
            if cat02 != "1":
                continue
            cat01 = v.get("@cat01", "")
            parsed = _parse_value(v.get("$", ""))
            if not cat01 or parsed is None:
                continue
            area_data.setdefault(area, {})[cat01] = parsed

        # 小地域集計の cat01 コード（総数系のみ）
        young_codes = {"0050", "0060", "0070", "0080"}       # 15-34歳
        family_codes = {"0090", "0100", "0110", "0120", "0130", "0140"}  # 35-64歳

        result: dict[str, dict] = {}
        for area, cats in area_data.items():
            total = cats.get("0010", 0)
            if total == 0:
                continue
            young = sum(cats.get(c, 0) for c in young_codes)
            family = sum(cats.get(c, 0) for c in family_codes)
            elderly = cats.get("0150", 0)  # 65歳以上
            result[area] = {
                "young_ratio": round(young / total, 4),
                "family_ratio": round(family / total, 4),
                "elderly_ratio": round(elderly / total, 4),
                "total_population": int(total),
            }

        if result:
            logger.info("小地域 年齢構成データ: %d エリア", len(result))
            return result
        logger.warning("小地域 年齢構成データが空 — 市区町村レベルにフォールバック")
    except Exception as e:
        logger.warning("小地域 年齢構成データ取得失敗: %s — 市区町村レベルにフォールバック", e)

    # フォールバック: 市区町村レベルデータを返す（呼び出し元で key_code[:5] でマッチ）
    logger.info("市区町村レベル年齢構成データで代替")
    return fetch_age_distribution(api_key)


def fetch_household_by_area(api_key: str) -> dict[str, dict]:
    """
    小地域（町丁字）レベルの世帯構成データを取得。

    e-Stat 小地域集計 statsDataId=8003006803
    「世帯人員別一般世帯数 東京都」を使用。

    cat01 コード体系:
        0010: 一般世帯数（世帯人員6人以上含む）= 総世帯数
        0020: 世帯人員1人 = 単身世帯

    @area は 11桁（丁目レベル）。cat02 は秘匿フラグ（1=無し）。

    Returns:
        {area_code_11digit: {single_ratio, total_households, single_households}}
    """
    logger.info("小地域 世帯構成データを取得中 (statsDataId=%s)...", STATS_HOUSEHOLD_SMALL_AREA)
    try:
        values = _fetch_estat_data(api_key, {
            "statsDataId": STATS_HOUSEHOLD_SMALL_AREA,
        })

        area_data: dict[str, dict[str, float]] = {}
        for v in values:
            area = v.get("@area", "")
            if len(area) != 11:
                continue
            cat02 = v.get("@cat02", "")
            if cat02 != "1":
                continue
            cat01 = v.get("@cat01", "")
            # 総世帯数(0010) と 単身世帯(0020) のみ必要
            if cat01 not in ("0010", "0020"):
                continue
            parsed = _parse_value(v.get("$", ""))
            if parsed is None:
                continue
            area_data.setdefault(area, {})[cat01] = parsed

        result: dict[str, dict] = {}
        for area, cats in area_data.items():
            total = cats.get("0010", 0)
            single = cats.get("0020", 0)
            if total == 0:
                continue
            result[area] = {
                "single_ratio": round(single / total, 4),
                "total_households": int(total),
                "single_households": int(single),
            }

        if result:
            logger.info("小地域 世帯構成データ: %d エリア", len(result))
            return result
        logger.warning("小地域 世帯構成データが空 — 市区町村レベルにフォールバック")
    except Exception as e:
        logger.warning("小地域 世帯構成データ取得失敗: %s — 市区町村レベルにフォールバック", e)

    # フォールバック: 市区町村レベルデータを返す
    logger.info("市区町村レベル世帯構成データで代替")
    return fetch_household_composition(api_key)


def fetch_all_estat_area_data(api_key: Optional[str] = None) -> dict[str, dict]:
    """
    小地域レベルの全 e-Stat データを取得し、area_code でマージ。

    - 年齢構成: 小地域レベル（利用可能な場合）or 市区町村フォールバック
    - 世帯構成: 小地域レベル（利用可能な場合）or 市区町村フォールバック
    - 昼夜間人口比: 市区町村レベルのみ（小地域データなし）

    key_code（11桁）でマッチできない場合は municipality_code（5桁）でフォールバック。

    Returns:
        {area_code: {young_ratio, family_ratio, elderly_ratio,
                     single_ratio, daytime_ratio, ...},
         "_daytime_by_muni": {municipality_code: {daytime_ratio}},
         "_is_municipality_level": bool}

        特殊キー:
        - "_daytime_by_muni": 昼夜間人口は常に市区町村レベル（呼び出し元で municipality_code でマッチ）
        - "_is_municipality_level": True なら年齢・世帯も市区町村レベル（key_code[:5] でマッチ必要）
    """
    if api_key is None:
        api_key = ESTAT_API_KEY

    if not api_key:
        raise ValueError("ESTAT_API_KEY が設定されていません")

    age_data = fetch_age_distribution_by_area(api_key)
    household_data = fetch_household_by_area(api_key)
    daytime_data = fetch_daytime_ratio(api_key)

    # 小地域レベルか市区町村レベルかを判定
    # 小地域の場合 area_code は 11桁、市区町村の場合は 5桁
    sample_key = next(iter(age_data), "")
    is_municipality_level = len(sample_key) <= 5

    # area_code でマージ
    all_codes = set(age_data) | set(household_data)
    result: dict[str, dict] = {}

    for code in sorted(all_codes):
        merged: dict[str, Any] = {}
        if code in age_data:
            merged.update(age_data[code])
        if code in household_data:
            merged.update(household_data[code])
        result[code] = merged

    # 昼夜間人口と判定フラグを特殊キーで格納
    result["_daytime_by_muni"] = daytime_data  # type: ignore[assignment]
    result["_is_municipality_level"] = is_municipality_level  # type: ignore[assignment]

    level_str = "市区町村" if is_municipality_level else "小地域"
    logger.info(
        "e-Stat エリア統合データ: %d エリア (%sレベル), 昼夜間=%d 市区町村",
        len(all_codes), level_str, len(daytime_data),
    )
    return result
