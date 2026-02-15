"""
スコア正規化ロジック
偏差値ベースで 0-100 スケールに変換する関数群
"""

import math
from typing import Optional

import numpy as np


def normalize_score(values: list[float]) -> list[float]:
    """
    偏差値ベースで 0-100 に正規化

    偏差値 = 50 + 10 * (x - mean) / std
    それを 0-100 にクリップ

    Args:
        values: 正規化する値のリスト

    Returns:
        0-100 の正規化スコアのリスト
    """
    if not values:
        return []

    arr = np.array(values, dtype=float)
    mean = np.mean(arr)
    std = np.std(arr)

    if std == 0:
        return [50.0] * len(values)

    # 偏差値を計算し、0-100 にクリップ
    deviation_scores = 50 + 10 * (arr - mean) / std
    clipped = np.clip(deviation_scores, 0, 100)
    return clipped.tolist()


def calculate_safety_score(crimes: int, all_crimes: list[int]) -> float:
    """
    犯罪件数から Safety スコアを算出
    犯罪が少ないほどスコアが高い（安全）

    Args:
        crimes: 対象駅の犯罪件数
        all_crimes: 全駅の犯罪件数リスト

    Returns:
        0-100 のスコア（高いほど安全）
    """
    if not all_crimes:
        return 50.0

    # 犯罪件数を反転（少ないほど高スコア）
    max_crimes = max(all_crimes)
    if max_crimes == 0:
        return 100.0

    inverted = [max_crimes - c for c in all_crimes]
    target_inverted = max_crimes - crimes

    scores = normalize_score(inverted)

    # 対象駅のインデックスを見つけてスコアを返す
    idx = all_crimes.index(crimes)
    return round(scores[idx], 1)


def calculate_hazard_score(
    flood_depth: Optional[float],
    landslide_warning: bool,
    landslide_special: bool,
    tsunami_depth: Optional[float],
    liquefaction_risk: str,
) -> tuple[float, float, float, float, float]:
    """
    Hazard スコア（合計 + 各サブスコア）を算出
    各サブスコアは 0-25 で、合計 0-100

    Args:
        flood_depth: 洪水浸水想定深（メートル）、None は浸水なし
        landslide_warning: 土砂災害警戒区域かどうか
        landslide_special: 土砂災害特別警戒区域かどうか
        tsunami_depth: 津波浸水想定深（メートル）、None は浸水なし
        liquefaction_risk: 液状化リスク（'low', 'moderate', 'high'）

    Returns:
        (total_score, flood_score, landslide_score, tsunami_score, liquefaction_score)
        スコアが高いほど安全
    """
    # 洪水スコア（0-25、浸水なし=25、5m以上=0）
    if flood_depth is None or flood_depth <= 0:
        flood_score = 25.0
    else:
        flood_score = max(0, 25.0 - (flood_depth / 5.0) * 25.0)

    # 土砂災害スコア（0-25）
    if landslide_special:
        landslide_score = 0.0
    elif landslide_warning:
        landslide_score = 10.0
    else:
        landslide_score = 25.0

    # 津波スコア（0-25）
    if tsunami_depth is None or tsunami_depth <= 0:
        tsunami_score = 25.0
    else:
        tsunami_score = max(0, 25.0 - (tsunami_depth / 10.0) * 25.0)

    # 液状化スコア（0-25）
    liquefaction_scores = {'low': 25.0, 'moderate': 12.5, 'high': 0.0}
    liquefaction_score = liquefaction_scores.get(liquefaction_risk, 12.5)

    total_score = flood_score + landslide_score + tsunami_score + liquefaction_score

    return (
        round(total_score, 1),
        round(flood_score, 1),
        round(landslide_score, 1),
        round(tsunami_score, 1),
        round(liquefaction_score, 1),
    )


def generate_vibe_tags(
    young_ratio: float,
    family_ratio: float,
    elderly_ratio: float,
    daytime_ratio: float,
    single_ratio: float,
    restaurant_count: int,
    park_count: int,
) -> list[str]:
    """
    各種データから Vibe タグを自動生成

    Args:
        young_ratio: 若年層比率（20-34歳）
        family_ratio: ファミリー層比率
        elderly_ratio: 高齢者比率（65歳以上）
        daytime_ratio: 昼夜間人口比率
        single_ratio: 単身世帯比率
        restaurant_count: 飲食店数
        park_count: 公園数

    Returns:
        タグのリスト
    """
    tags: list[str] = []

    # 人口構成に基づくタグ
    if young_ratio > 0.25:
        tags.append("若者が多い")
    if family_ratio > 0.30:
        tags.append("ファミリー向け")
    if elderly_ratio > 0.30:
        tags.append("高齢者が多い")
    if single_ratio > 0.50:
        tags.append("一人暮らし向け")

    # 昼夜間人口比率に基づくタグ
    if daytime_ratio > 1.5:
        tags.append("オフィス街")
    elif daytime_ratio < 0.8:
        tags.append("ベッドタウン")

    # 施設に基づくタグ
    if restaurant_count > 100:
        tags.append("グルメ充実")
    if park_count > 5:
        tags.append("緑が多い")

    return tags
