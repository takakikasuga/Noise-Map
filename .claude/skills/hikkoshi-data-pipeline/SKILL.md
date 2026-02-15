---
name: hikkoshi-data-pipeline
description: "ヒッコシマップのデータパイプライン実装パターン。pipeline/ 配下のPythonスクリプトの作成・修正時に使用。データソースAPI呼び出し、CSVパース、スコア正規化、Supabase投入のベストプラクティスを含む。"
---

# ヒッコシマップ データパイプラインスキル

pipeline/ ディレクトリのPythonスクリプトを作成・修正する際のガイドライン。

## 環境セットアップ

```bash
cd pipeline
python3.12 -m venv .venv    # Python 3.12 必須（3.10+ の型構文を使用）
source .venv/bin/activate
pip install -r requirements.txt
```

環境変数（`.env.local` または `.env.production.local`）:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase プロジェクト URL
- `SUPABASE_SERVICE_ROLE_KEY` — service_role キー（pipeline 用）

## スクリプト実行順序（厳守）

```
01_fetch_stations.py       → 駅マスタ（他の全スクリプトの前提）
02_fetch_safety.py         → 犯罪データ投入 + 駅安全スコア
03_fetch_hazard.py         → 災害リスク
04_fetch_vibe.py           → 雰囲気データ
05_calculate_scores.py     → 総合ランキング再計算
06_enrich_areas.py         → 町丁目の name_en / score / rank 付与
07_geocode_missing_areas.py → centroid が NULL の町丁目を GSI ジオコーディング
```

依存関係:
- 01 が完了していない状態で 02〜05 を実行してはならない（stations テーブルへのFK依存）
- 06, 07 は 02 の後に実行する（town_crimes テーブルへの依存）

## 年次データ追加の運用手順

新しい年度の犯罪データを追加する際の手順。**この順序を厳守すること。**

### 1. CSVファイル配置

警視庁の「区市町村の町丁別、罪種別及び手口別認知件数」CSV を取得し、配置する:

```
pipeline/data/raw/metropolitan/
├── H29.csv      # 2017年（平成29年）
├── H30.csv      # 2018年
├── H31.csv      # 2019年
├── R2.csv       # 2020年
├── R3.csv       # 2021年
├── R4.csv       # 2022年
├── R5.csv       # 2023年
├── R6.csv       # 2024年
└── R7/R7.11.csv # 2025年（令和7年・月次更新）
```

※ H29〜R4 は UTF-8 または cp932。エンコーディングは `_detect_encoding()` で自動判定される。

### 2. CSV_FILES に年度を追加

`pipeline/scripts/02_fetch_safety.py` の `CSV_FILES` dict にエントリを追加:

```python
CSV_FILES = {
    2017: str(DATA_DIR / "metropolitan" / "H29.csv"),
    # ... 既存年度 ...
    2026: str(DATA_DIR / "metropolitan" / "R8.csv"),  # 新規追加
}
```

### 3. 実行（4ステップ）

```bash
cd pipeline
source .venv/bin/activate

# Step 1: 犯罪データ投入 + 駅スコア算出（--year で単年指定可）
python scripts/02_fetch_safety.py --year 2026

# Step 2: name_en / score / rank 付与（全年分を一括処理）
python scripts/06_enrich_areas.py

# Step 3: centroid が NULL の行を GSI ジオコーディング
python scripts/07_geocode_missing_areas.py

# Step 4: SQL で centroid → lat/lng 抽出（Supabase ダッシュボードまたは MCP で実行）
# ※ 02 は centroid(geography) を設定するが lat/lng は設定しないため必要
UPDATE town_crimes
SET lat = ST_Y(centroid::geometry), lng = ST_X(centroid::geometry)
WHERE centroid IS NOT NULL AND lat IS NULL;
```

### 4. 検証

```sql
-- 各年のカバレッジ確認
SELECT year, COUNT(*) as total,
  COUNT(name_en) as has_name_en,
  COUNT(score) as has_score,
  COUNT(rank) as has_rank,
  COUNT(lat) as has_lat
FROM town_crimes GROUP BY year ORDER BY year;
```

期待値: name_en / score / rank は 100%、lat/lng は 99.5%+（「以下不詳」等の特殊エントリのみ NULL）

### 既知の注意点

- **Polygon → MultiPolygon**: `crime_parser.py` の `_find_parent_union` は `unary_union` の結果が Polygon になりうる。MultiPolygon に変換済み（修正済み）。
- **06 の name_en 欠損**: `06_enrich_areas.py` は全行を UPSERT するが、ページネーションや処理の問題で一部 NULL が残る場合がある。SQL で他年度からコピーして補完する:
  ```sql
  UPDATE town_crimes t SET name_en = ref.name_en
  FROM (SELECT DISTINCT area_name, name_en FROM town_crimes WHERE name_en IS NOT NULL) ref
  WHERE t.area_name = ref.area_name AND t.name_en IS NULL;
  ```
- **rank の再計算**: SQL の window function が最も確実:
  ```sql
  UPDATE town_crimes t SET rank = sub.new_rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY year ORDER BY total_crimes ASC, area_name ASC) as new_rank
    FROM town_crimes
  ) sub WHERE t.id = sub.id;
  ```

## 共通パターン

### スクリプト構造

すべてのスクリプトは以下の構造に従う:

```python
#!/usr/bin/env python3
"""
スクリプトの目的を1行で説明。

データソース: ソースURL
出力テーブル: テーブル名
更新頻度: 月次 / 年次
"""

import argparse
import logging
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.supabase_client import get_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def main(args):
    """メイン処理"""
    logger.info("開始: %s", __file__)

    client = get_client()

    # 1. データ取得
    # 2. データ加工
    # 3. スコア計算
    # 4. Supabase投入

    logger.info("完了: %d 件処理", count)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="DBに書き込まない")
    parser.add_argument("--limit", type=int, default=0, help="処理件数制限（デバッグ用）")
    args = parser.parse_args()
    main(args)
```

### エラーハンドリング

- API呼び出しは必ず `try/except` で囲む
- リトライは最大3回、exponential backoff（1秒→2秒→4秒）
- 失敗した駅はスキップしてログに記録し、処理全体は止めない
- `--dry-run` フラグでDB書き込みをスキップできるようにする

```python
import time

def fetch_with_retry(url, params, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** attempt
            logger.warning("リトライ %d/%d (%s秒後): %s", attempt + 1, max_retries, wait, e)
            time.sleep(wait)
```

### Supabase投入パターン

- バッチINSERTを使う（1行ずつINSERTしない）
- UPSERTを使い、再実行しても重複しないようにする
- バッチサイズは100件ずつ

```python
def upsert_batch(client, table, records, batch_size=100):
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        result = client.table(table).upsert(batch).execute()
        logger.info("  %d/%d 件投入", min(i + batch_size, len(records)), len(records))
```

## データソース別ガイドライン

### 01: 駅マスタ（国土数値情報 GML）

- GMLファイルは `lxml.etree` でパース
- 名前空間に注意: `ksj:` プレフィックスが使われる
- 同名駅の統合: 同じ駅名で座標が500m以内の場合は同一駅とみなし、路線名を `lines[]` に集約
- `name_en` はローマ字変換（`pykakasi` 使用）し、ハイフン区切りでURL用スラッグを生成
- 東京都以外の駅はフィルタリング（都道府県コード "13"）

### 02: 治安データ（警視庁 CSV）

**データフロー:**
```
警視庁 CSV → crime_parser.py パース → town_crimes テーブル（町丁目レベル）
                                      → safety_scores テーブル（駅レベル、市区町村集計）
```

**CSV仕様:**
- エンコーディング: UTF-8 または cp932（`_detect_encoding()` で自動判定）
- 町丁目名の表記ゆれ: `normalize_area_name()` で正規化（全角→半角、漢数字→算用数字、郡名・大字除去）
- 集計行（「〜計」「合計」）は `_SKIP_PATTERNS` で自動除外
- 市区町村のみの行も除外（町丁目レベルのみ投入）

**ポリゴンマッチング:**
1. 小地域境界 Shapefile（`r2ka13.shp`）から正規化名で完全一致
2. 親エリア→子丁目の union フォールバック（例: 「昭島市福島町」→「昭島市福島町1丁目」+「2丁目」...）
3. マッチ率は約 90%（残りは 07 で GSI ジオコーディング）

**スコア計算:** 偏差値方式（`lib/normalizer.py`）
- `50 + 10 * (x - mean) / std`、[0, 100] にクリップ
- 犯罪件数を反転してから偏差値化（少ないほど高スコア）

**テーブル構成:**
- `town_crimes`: 町丁目×年単位。boundary/centroid は geography 型（本番）
- `safety_scores`: 駅×年単位。town_crimes を市区町村レベルで集計して算出

### 03: 災害データ（不動産情報ライブラリ API）

- APIレートリミットに注意（1秒1リクエスト程度に制限）
- レスポンスはGeoJSON形式の場合がある
- 800駅 × 4カテゴリ = 3,200リクエスト → 約1時間かかる見込み
- 進捗表示を必ず入れる（`tqdm` 推奨）

### 04: 雰囲気データ（e-Stat + Overpass）

- e-Stat API: statsDataId を正確に指定する必要がある（国勢調査のテーブルID）
- Overpass API: クエリが重いのでタイムアウトを長めに設定（60秒）
- Overpass クエリ例（駅周辺の飲食店）:

```
[out:json][timeout:60];
(
  node["amenity"="restaurant"](around:1000,{lat},{lng});
  way["amenity"="restaurant"](around:1000,{lat},{lng});
);
out count;
```

## lib/ モジュール一覧

| モジュール | 役割 |
|-----------|------|
| `supabase_client.py` | Supabase クライアント取得、`upsert_records()`, `select_all()` |
| `normalizer.py` | 偏差値計算 `normalize_score()` |
| `crime_parser.py` | 警視庁 CSV パース、町丁目名正規化、Shapefile 読み込み、ポリゴンマッチング |
| `geo_utils.py` | 市区町村コード定数 `TOKYO_MUNICIPALITIES`、ローマ字変換 `romanize_station_name()`、GSI ジオコーディング `forward_geocode_gsi()` |
| `estat_client.py` | e-Stat API クライアント |
| `overpass_client.py` | OpenStreetMap Overpass API クライアント |

## 現在のデータ規模（参考）

- **stations**: 659 駅
- **town_crimes**: ~45,700 行（9年分: 2017-2025、各年 ~5,000 町丁目）
- **safety_scores**: ~5,931 行（659駅 × 9年）
- **Shapefile マッチ率**: ~90%（残り ~10% は GSI ジオコーディングで補完）

## テスト

- 各スクリプトは `--limit 5` で少数の駅だけ処理してテスト可能にする
- `--dry-run` で DB 書き込みなしのテストを可能にする
- スコア計算ロジックは `lib/normalizer.py` に分離し、ユニットテスト可能にする
