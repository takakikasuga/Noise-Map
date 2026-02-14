# データパイプライン設計

## 全体フロー

```
01_fetch_stations.py   国土数値情報GML → stations テーブル
        ↓
02_fetch_safety.py     警視庁CSV → 駅紐付け → safety_scores テーブル
        ↓
03_fetch_hazard.py     不動産情報ライブラリAPI → hazard_data テーブル
        ↓
04_fetch_vibe.py       e-Stat API + Overpass API → vibe_data テーブル
        ↓
05_calculate_scores.py 全駅スコア再計算・ランキング更新
        ↓
next build             800ページSSG生成 → Vercel deploy
```

更新頻度: Safety＝月次（警視庁データ更新に合わせて）、Hazard/Vibe＝年次。

---

## 0. 駅マスタ（Foundation）

### データソース
- **国土数値情報「鉄道データ」**（GML形式）
- URL: https://nlftp.mlit.go.jp/ksj/
- 東京都（都道府県コード: 13）の鉄道駅を抽出

### 処理フロー
1. GMLファイルをパース
2. 東京都内の駅を抽出
3. 同名駅の重複統合（乗り入れ路線は lines[] に集約）
4. 逆ジオコーディングで区市町村コード（JIS 6桁）を付与

### スキーマ: stations
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| name | TEXT | 駅名（日本語） |
| name_en | TEXT | URL用スラッグ（英語、UNIQUE） |
| location | GEOGRAPHY(POINT, 4326) | 緯度経度 |
| municipality_code | TEXT | JIS 6桁市区町村コード |
| municipality_name | TEXT | 市区町村名 |
| lines | TEXT[] | 路線名配列 |
| created_at | TIMESTAMPTZ | 作成日時 |

**重要**: municipality_code が Safety/Hazard/Vibe 全レイヤーのリンクキー。

---

## 1. Safety レイヤー

### データソース
- **警視庁「区市町村の町丁別、罪種別及び手口別認知件数」CSV**
- URL: https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html
- 必要ファイル:
  - 令和6年（2024年）年間累計 CSV（489KB）— メインデータ
  - 令和5年（2023年）年間累計 CSV（487KB）— 前年比較用

### CSV構造（想定）
```
区市町村, 町丁目, 全刑法犯, 凶悪犯, 粗暴犯, 窃盗犯, 知能犯, 風俗犯, その他, ...
千代田区, 飯田橋一丁目, 15, 0, 2, 8, 1, 0, 4, ...
八王子市, 旭町, 23, 0, 3, 15, 2, 0, 3, ...
```

### 処理フロー
1. CSVパース（町丁目レベルの犯罪件数）
2. 各駅の半径1km圏内の町丁目を特定（PostGIS空間クエリ）
3. 圏内の犯罪件数を合算
4. 偏差値ベースで0-100スコアに正規化（少ない＝高スコア＝安全）
5. 全800駅でランキング算出

### スコアリングロジック
```
z-score = (mean - station_crimes) / std
deviation = 50 + 10 * z-score
score = clip(deviation, 0, 100)
```
犯罪が少ないほどスコアが高い（安全な駅ほど高スコア）。

### スキーマ: safety_scores
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| station_id | UUID | FK → stations |
| year | INT | 年 |
| month | INT | 月（NULLなら年間） |
| total_crimes | INT | 全刑法犯件数 |
| crimes_violent | INT | 凶悪犯 |
| crimes_assault | INT | 粗暴犯 |
| crimes_theft | INT | 窃盗犯 |
| crimes_intellectual | INT | 知能犯 |
| crimes_other | INT | その他 |
| score | FLOAT | 0-100 |
| rank | INT | 順位 |
| previous_year_total | INT | 前年合計（比較用） |
| data_granularity | TEXT | 'town'（町丁目）or 'municipality'（市区町村） |
| updated_at | TIMESTAMPTZ | 更新日時 |

### 注意点
- 23区は町丁目レベルのデータが取得可能
- 多摩地域は市町村レベルになる場合がある（data_granularity で区別）

---

## 2. Hazard レイヤー

### データソース
- **不動産情報ライブラリ API**（国土交通省）
- 申請URL: https://www.reinfolib.mlit.go.jp/api/request/
- 利用にはAPI申請が必要（審査に数日）

### 処理フロー
各駅の緯度経度から半径1km圏内のハザード情報を取得し、4カテゴリで評価:

| カテゴリ | データ | スコア（0-25） |
|---------|--------|-------------|
| 洪水 | 浸水深（なし/0.5m未満/0.5-3m/3-5m/5m以上） | 25→0 |
| 土砂災害 | 警戒区域/特別警戒区域 | 25→0 |
| 津波 | 浸水想定深 | 25→0 |
| 液状化 | リスクレベル（低/中/高） | 25→0 |

合計スコア = 4カテゴリの合算（0-100、リスクが低い＝高スコア）。

### スキーマ: hazard_data
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| station_id | UUID | FK → stations (UNIQUE) |
| flood_level | TEXT | 'none'/'low'/'moderate'/'high'/'extreme' |
| flood_depth_max | FLOAT | 最大浸水深(m) |
| landslide_warning | BOOLEAN | 土砂災害警戒区域 |
| landslide_special | BOOLEAN | 特別警戒区域 |
| tsunami_level | TEXT | 'none'/'low'/'moderate'/'high'/'extreme' |
| tsunami_depth_max | FLOAT | 最大津波浸水深(m) |
| liquefaction_risk | TEXT | 'low'/'moderate'/'high' |
| score | FLOAT | 合計 0-100 |
| rank | INT | 順位 |
| flood_score | FLOAT | 洪水サブスコア 0-25 |
| landslide_score | FLOAT | 土砂サブスコア 0-25 |
| tsunami_score | FLOAT | 津波サブスコア 0-25 |
| liquefaction_score | FLOAT | 液状化サブスコア 0-25 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

## 3. Vibe レイヤー

### データソース（3種）

#### (a) e-Stat API — 人口統計
- URL: https://www.e-stat.go.jp/api/
- 取得データ: 区市町村別の年齢別人口、世帯構成、昼間人口比率
- 即時APIキー発行

#### (b) OpenStreetMap Overpass API — 施設密度
- 無料・申請不要
- 取得データ: 駅から半径1km圏内の飲食店・コンビニ・公園・学校・病院の件数

#### (c) UGC口コミ — ユーザー投稿
- Supabase に直接投稿
- MVP段階ではNLP処理なし（テキストそのまま保存・表示）

### 処理フロー
1. e-Stat: 年齢分布 → 若者多い/ファミリー層/高齢者多い を分類
2. e-Stat: 昼間人口比率 → ベッドタウン/繁華街 を判定
3. OSM: 施設カウント → タグ自動生成

### タグ生成ルール（ルールベース）
```
family_ratio > 0.3 → 「ファミリー向き」
young_ratio > 0.25 → 「若者が多い」
elderly_ratio > 0.35 → 「高齢者が多い」
daytime_ratio > 1.2 → 「繁華街・オフィス街」
daytime_ratio < 0.8 → 「ベッドタウン」
restaurant_count > 100 → 「飲食店充実」
park_count > 5 → 「緑豊か」
single_ratio > 0.5 → 「一人暮らし向き」
```

### スキーマ: vibe_data
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| station_id | UUID | FK → stations (UNIQUE) |
| population_young_ratio | FLOAT | 若年層比率 |
| population_family_ratio | FLOAT | ファミリー層比率 |
| population_elderly_ratio | FLOAT | 高齢者比率 |
| daytime_population_ratio | FLOAT | 昼夜間人口比率 |
| single_household_ratio | FLOAT | 単身世帯比率 |
| restaurant_count | INT | 飲食店数 |
| convenience_store_count | INT | コンビニ数 |
| park_count | INT | 公園数 |
| school_count | INT | 学校数 |
| hospital_count | INT | 病院数 |
| tags | TEXT[] | 自動生成タグ |
| updated_at | TIMESTAMPTZ | 更新日時 |

### スキーマ: ugc_posts
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| station_id | UUID | FK → stations |
| content | TEXT | 投稿内容 |
| category | TEXT | 'safety'/'noise'/'community'/'vibe'/'other' |
| rating | INT | 1-5（任意） |
| ip_hash | TEXT | スパム対策用IPハッシュ |
| created_at | TIMESTAMPTZ | 投稿日時 |

---

## RLS（Row Level Security）ポリシー

全テーブル（stations, safety_scores, hazard_data, vibe_data, ugc_posts）に対して:
- **SELECT**: 全員許可（公開データ）
- **INSERT**: ugc_posts のみ全員許可（口コミ投稿）
- **UPDATE/DELETE**: service_role キーのみ（管理者・パイプライン）
