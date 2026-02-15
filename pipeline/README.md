# ヒッコシマップ データパイプライン

東京都の住環境リスクデータを収集・加工し、Supabase に格納するパイプライン。

## セットアップ

```bash
cd pipeline
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 環境変数

プロジェクトルートの `.env` に以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
ESTAT_API_KEY=your_estat_api_key
REINFOLIB_API_KEY=your_reinfolib_api_key
```

## 実行順序

スクリプトは以下の順序で実行してください:

| # | スクリプト | 説明 | データソース |
|---|-----------|------|-------------|
| 1 | `01_fetch_stations.py` | 駅マスタ取得 | 国土数値情報 GML |
| 2 | `02_fetch_safety.py` | 治安データ取得 | 警視庁 CSV/Excel |
| 3 | `03_fetch_hazard.py` | 災害リスク取得 | 不動産情報ライブラリ API |
| 4 | `04_fetch_vibe.py` | 雰囲気データ取得 | e-Stat API + Overpass API |
| 5 | `05_calculate_scores.py` | 全駅スコア再計算 | Supabase (内部データ) |

## 使用例

```bash
# 駅マスタを取得
python scripts/01_fetch_stations.py --gml-path data/N02-23_GML/N02-23_Station.gml

# 治安データを取得（2024年度）
python scripts/02_fetch_safety.py --data-path data/safety/crime_2024.csv --year 2024

# 災害リスクを取得
python scripts/03_fetch_hazard.py

# 雰囲気データを取得
python scripts/04_fetch_vibe.py

# 全駅スコアを再計算
python scripts/05_calculate_scores.py
```

## ディレクトリ構成

```
pipeline/
├── scripts/          # 実行スクリプト
├── lib/              # 共通ライブラリ
├── config/           # 設定ファイル
├── data/             # ダウンロードデータ（.gitignore）
├── requirements.txt
├── pyproject.toml
└── README.md
```
