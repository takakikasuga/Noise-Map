---
name: hikkoshi-data-pipeline
description: "ヒッコシマップのデータパイプライン実装パターン。pipeline/ 配下のPythonスクリプトの作成・修正時に使用。データソースAPI呼び出し、CSVパース、スコア正規化、Supabase投入のベストプラクティスを含む。"
---

# ヒッコシマップ データパイプラインスキル

pipeline/ ディレクトリのPythonスクリプトを作成・修正する際のガイドライン。

## スクリプト実行順序（厳守）

```
01_fetch_stations.py  → 駅マスタ（他の全スクリプトの前提）
02_fetch_safety.py    → 治安スコア
03_fetch_hazard.py    → 災害リスク
04_fetch_vibe.py      → 雰囲気データ
05_calculate_scores.py → ランキング再計算
```

01 が完了していない状態で 02〜05 を実行してはならない（stations テーブルへのFK依存）。

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

from config.settings import SUPABASE_URL, SUPABASE_KEY
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

- CSVのエンコーディングは `Shift_JIS` の可能性が高い（`encoding='cp932'`で読む）
- ヘッダ行が複数行にまたがる場合がある（`skiprows` で調整）
- 町丁目名の表記ゆれに注意（全角/半角、丁目の漢数字/算用数字）
- 駅への紐付け: 町丁目の代表点座標が必要 → 国土数値情報「位置参照情報」を補助データとして使う
- スコア計算: 偏差値方式（平均50、標準偏差10）

```python
import numpy as np

def calculate_safety_score(crimes_list):
    arr = np.array(crimes_list)
    mean = arr.mean()
    std = arr.std()
    if std == 0:
        return [50.0] * len(crimes_list)
    z_scores = (mean - arr) / std  # 犯罪が少ない = 高スコア
    scores = 50 + 10 * z_scores
    return np.clip(scores, 0, 100).tolist()
```

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

## テスト

- 各スクリプトは `--limit 5` で少数の駅だけ処理してテスト可能にする
- `--dry-run` で DB 書き込みなしのテストを可能にする
- スコア計算ロジックは `lib/normalizer.py` に分離し、ユニットテスト可能にする
