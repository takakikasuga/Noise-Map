# タスク管理

## Week 1: データ取得・基盤構築

### ヒューマンタスク（アカウント作成・データ取得）

所要時間: 約50分 + API審査待ち

| # | タスク | 所要時間 | URL/手順 | 状態 |
|---|--------|---------|---------|------|
| H1 | 不動産情報ライブラリ API 申請 | 10分+審査待ち | https://www.reinfolib.mlit.go.jp/api/request/ から申請。審査に数日かかる可能性あり。最優先で申請を出す | ⬜ |
| H2 | e-Stat API 利用登録 | 5分 | https://www.e-stat.go.jp/api/ でアカウント作成 → APIキー即時発行 | ✅ |
| H3 | Supabase プロジェクト作成 | 5分 | https://supabase.com でアカウント作成 → 新規プロジェクト → 接続情報（URL・anon key・service role key）を控える | ✅ |
| H4 | Vercel アカウント作成 | 5分 | https://vercel.com でGitHub連携 | ⬜ |
| H5 | GitHub リポジトリ作成 | 5分 | Turborepoプロジェクト用リポジトリ | ✅ |
| H6 | 警視庁 犯罪CSV ダウンロード | 1分 | https://www.keishicho.metro.tokyo.lg.jp/about_mpd/jokyo_tokei/jokyo/ninchikensu.html から令和6年・令和5年の年間累計CSVを2つDL | ✅ |
| H7 | 国土数値情報「鉄道データ」DL | 5分 | https://nlftp.mlit.go.jp/ksj/ から東京都の鉄道データ（GML）をDL | ✅ |
| H8 | ドメイン取得 | 10分 | 後回しでもOK。公開時までに取得すればよい | ⬜ |

### AIタスク（コード・スキーマ生成）

| # | タスク | 依存 | 内容 | 状態 |
|---|--------|------|------|------|
| A0 | Turborepoプロジェクト基盤構築 | なし | Agent Teams で4チームメイト並行作業。モノレポ構成・Next.js・共有パッケージ・Pythonパイプラインのスケルトン | ✅ |
| A1 | Supabase スキーマSQL作成 | なし | CREATE TABLE文・インデックス・RLS。packages/supabase/migrations/ に配置済み | ✅ |
| A2 | 駅マスタ作成スクリプト実装 | H7 | GMLパース → 東京都内駅抽出 → 重複統合 → Supabase INSERT | ✅ |
| A3 | 警視庁犯罪データパーサー実装 | H6 | CSVパース → 駅に紐付け → スコア計算 → safety_scores INSERT | ✅ |
| A4 | e-Stat API取得スクリプト実装 | H2 | 人口統計データ取得 → vibe_data INSERT（Overpass施設データは後日追加） | ✅ |
| A5 | Supabase データ投入スクリプト | H3 | 加工済みデータをSupabaseにINSERT | ✅ |
| A6 | Next.js ページ実装 | A0,A1 | 駅ページUI・SSG generateStaticParams・比較ページ。659駅の静的ページ生成完了。Safetyセクション実データ表示、検索オートコンプリート、比較テーブル実装済み。※比較ページはB8でエリア比較に移行済み | ✅ |
| A7 | プロジェクトドキュメント | なし | README・ディレクトリ構成ドキュメント | ✅ |

### 推奨進行フロー

```
[並行可能]
  Human: H1(最優先) → H2 → H3 → H4 → H6 → H7
  AI:    A0 ✅ → A1 ✅ → A7 ✅

[H6/H7完了後]
  Human: ファイルをアップロード
  AI:    A2（駅マスタ） → A3（犯罪データ）

[H2完了後]
  Human: APIキーを共有
  AI:    A4（e-Stat）

[H3完了後]
  Human: Supabase接続情報を共有
  AI:    A5（データ投入）

[全データ投入後]
  AI:    A6（フロントエンドUI実装）
```

## 今後のWeek

### Week 2: フロントエンド実装 ✅
- ✅ 駅ページのUI実装（Safety/Hazardセクション）
- ✅ 地図コンポーネント（Leaflet）— 駅ページ周辺マップ + トップページ俯瞰マップ
- ✅ recharts グラフ表示（犯罪推移チャート + 犯罪種別内訳チャート）
- ✅ 比較ページ実装（B8でエリア比較に移行済み）
- ✅ ランキング修正（TOP/BOTTOM クエリのバグ修正）

### Week 3: UX改善・SEO・デプロイ
- ✅ SEO最適化（metadata, OGP, structured data, sitemap.ts）
- ✅ 市区町村ナビゲーション・ページ追加（B6）
- ✅ 治安エリアマップ（カラーグラデーション + フィルタリング）（B7）
- ✅ UGC投稿・表示機能（エリアページに「住民の声」セクション実装済み）
- ⬜ Vercelデプロイ・ドメイン設定
- ⬜ 動作テスト・パフォーマンス最適化

### Week 4: ローンチ・計測
- 本番デプロイ
- Vercel Analytics 設定
- 初期ユーザー獲得施策
- KPI計測開始

---

## 残タスク（バックログ）

| # | タスク | 優先度 | 内容 | 状態 |
|---|--------|--------|------|------|
| B1 | Overpass API 施設データ追加 | — | バッチクエリ（10駅/回）+ エンドポイントローテーション（3サーバー）で429/504対策済み。659駅全件の施設データ（飲食店・コンビニ・公園・学校・病院）を vibe_data に投入完了 | ✅ |
| B2 | 不動産情報ライブラリ API (Hazard) | 中 | H1 の API 審査完了後、`03_fetch_hazard.py` を実装。洪水・土砂・津波・液状化リスクを取得 | ⬜ |
| B3 | 全駅スコア再計算 | — | `05_calculate_scores.py` 実装完了。偏差値ベースのスコア再計算 + ランク1-659付与。3年分 (2023/2024/2025) × 659駅 = 1,977件更新済み | ✅ |
| B4 | 偏差値表示に変更 | — | 表示ラベルを「スコア」→「偏差値」に変更。ScoreGauge・SafetySection・比較テーブル・ランキング等の全箇所。計算ロジックは既に偏差値ベース（平均50, σ=10）なのでUIのみの変更 | ✅ |
| B5 | 町丁目ベース検索・ページ追加 | — | 下記「B5 進捗」参照。パイプライン（スラッグ・偏差値・ファジーマッチング）+ フロントエンド（型定義・DB関数・エリアページSSG・検索バー拡張・トップページ更新）全完了。1,664ページSSGビルド成功 | ✅ |
| B6 | 市区町村ナビゲーション・ページ追加 | — | 下記「B6 進捗」参照。SearchBar に市区町村検索（最上位表示）、トップページに「エリアから探す」セクション（23区+多摩地域）、ヘッダーナビに「エリア」リンク追加。市区町村ページに全エリア一覧（偏差値順）表示 | ✅ |
| B7 | 治安エリアマップ | — | 下記「B7 進捗」参照。トップページに独立した治安エリアマップを追加。約5,075エリアの偏差値カラーグラデーション表示 + スコア範囲フィルタリング | ✅ |
| B8 | Vibeデータ丁目単位化 + 比較ページエリア化 | — | 下記「B8 進捗」参照。駅単位→丁目単位に移行。areas マスタ（5,064件）+ area_vibe_data（5,064件）全件投入完了。比較ページを駅→エリア比較に完全移行。旧 `VibeData` 型・駅Vibeセクション・不要DB関数を削除 | ✅ |

---

## B5 進捗: 町丁目ベース検索・ページ追加

### 完了済み

| ステップ | 内容 | 状態 |
|---------|------|------|
| DB マイグレーション | `town_crimes` テーブルに `name_en`, `score`, `rank`, `lat`, `lng` カラム追加。lat/lng は centroid から同期済み。インデックス3つ追加 | ✅ |
| パイプライン (スラッグ・偏差値) | `pipeline/scripts/06_enrich_areas.py` 作成・実行済み。5,250エリアのスラッグ生成（pykakasi）+ 偏差値計算（年別）。15,278行全て更新完了 | ✅ |
| ファジーマッチング | `crime_parser.py` に親→子 union フォールバック追加。`geo_utils.py` に GSI 順ジオコーディング関数追加。`07_geocode_missing_areas.py` で NULL centroid を 484件→16件に改善（親union=22, GSI=474）。残り16件は公園・不詳で回収不可 | ✅ |

### フロントエンド実装

| # | タスク | ファイル | 状態 |
|---|--------|---------|------|
| B5-1 | 共有型定義 | `packages/shared/src/types/area.ts` (新規), `packages/shared/src/index.ts` (修正) | ✅ |
| B5-2 | データ取得関数 | `apps/web/lib/db.ts` (修正) | ✅ |
| B5-3 | エリアページ SSG | `apps/web/app/area/[slug]/page.tsx` (新規), `SafetySection.tsx` (修正) | ✅ |
| B5-4 | 検索バー拡張 | `apps/web/components/ui/SearchBar.tsx` (修正) | ✅ |
| B5-5 | トップページ更新 | `apps/web/app/page.tsx` (修正) | ✅ |

### 実装詳細

- **B5-1**: `AreaSafety` インターフェース作成 + re-export
- **B5-2**: `getAllAreas()`, `getAreaBySlug(slug)`, `getAreaSafety(nameEn)`, `getAreaListForSearch()` の4関数追加。既存の snakeToCamel + cache パターンに従う
- **B5-3**: エリアページ SSG。SafetySection・StationMap・ScoreGauge を再利用。構成: ヘッダー → 偏差値ゲージ → 治安セクション → 周辺マップ。SafetySection に `totalCount`/`entityLabel` props 追加（エリアは「5250エリア中」表示）
- **B5-4**: SearchBar に `areas` prop 追加。駅とエリアをグループヘッダー付きで表示。駅は前方一致、エリアは部分一致で検索
- **B5-5**: `getAreaListForSearch()` を呼び出し、SearchBar に `areas` prop を渡す。ヒーローテキストに「約659駅 + 約5250エリア」表示

### スキルレビュー・修正

実装後に `vercel-react-best-practices` / `hikkoshi-seo` / `hikkoshi-supabase` でレビューし、以下を修正:

| # | スキル | 問題 | 修正 | 状態 |
|---|--------|------|------|------|
| 1 | `async-parallel` | エリアページで `getAreaBySlug` → `getAreaSafety` を逐次実行 | `Promise.all` で並列化（slug === nameEn） | ✅ |
| 2 | `server-serialization` | `getAreaListForSearch` が5,250件に `municipality_name` を含めて過大 | クエリから `municipality_name` を除外し転送量削減 | ✅ |
| 3 | `hikkoshi-seo` | OGP メタデータ未設定 | `openGraph` (title/description/url) + `alternates.canonical` 追加 | ✅ |
| 4 | `hikkoshi-seo` | description にスコアなし | 偏差値数値を description に含めてCTR向上 | ✅ |
| 5 | `hikkoshi-seo` | JSON-LD 構造化データなし | Place スキーマ + BreadcrumbList JSON-LD 追加 | ✅ |
| 6 | `hikkoshi-seo` | sitemap.ts 未作成 | `app/sitemap.ts` 新規作成。659駅 + 5,250エリア全件出力 | ✅ |
| 7 | `hikkoshi-supabase` | SSGバッチ取得（5,250ページ×2クエリ） | 保留。`cache()` 重複排除で緩和。デプロイ後に検討 | 🔧 |

### ビルド結果

- `pnpm build` 成功（39秒）
- **1,665ページ SSG**（659駅 + 1,000エリア + sitemap + 比較 + トップ + 404）
- TypeScript 型エラーなし
- エリアページは ISR 対応: 初回1,000ページを静的生成、残りはオンデマンド生成

### DB 現況（参考）

- `town_crimes` テーブル: 15,278行（5,250ユニークエリア × 3年: 2023/2024/2025）
- `name_en` 例: `chiyodaku-marunouchi-1-choume`, `shibuyaku-dougenzaka-2-choume`
- 安全なエリア TOP: 練馬区北町4丁目 (偏差値54.9) / 危険なエリア: 豊島区南池袋1丁目 (偏差値0.0)
- centroid カバー率: 99.7%（5,075/5,091）。残り16件は公園・不詳 → マップ非表示で問題なし

### パイプラインスクリプト（参考）

| スクリプト | 用途 | 状態 |
|-----------|------|------|
| `06_enrich_areas.py` | town_crimes にスラッグ・偏差値・ランクを付与 | ✅ 実行済み |
| `07_geocode_missing_areas.py` | NULL centroid を親→子union + GSI API で補完 | ✅ 実行済み |

---

## B6 進捗: 市区町村ナビゲーション・ページ追加

住環境リスクの検索は「市区町村名」が起点（例: 「足立区 治安」）。駅検索より優先度が高いため、全ナビゲーションに市区町村導線を追加。

### 実装内容

| # | タスク | ファイル | 内容 |
|---|--------|---------|------|
| B6-1 | 検索バーに市区町村追加 | `SearchBar.tsx` | `cities` prop 追加。検索結果の表示順を「市区町村 → 駅 → エリア」に変更。前方一致検索 |
| B6-2 | トップページ「エリアから探す」 | `page.tsx` | `TOKYO_MUNICIPALITIES` を23区/多摩地域に分割してリンク一覧表示（id="areas"） |
| B6-3 | ヘッダーナビ追加 | `layout.tsx` | 「エリア」リンク（`/#areas`）をナビに追加 |
| B6-4 | 市区町村ページ全エリア一覧 | `city/[slug]/page.tsx`, `AreaList.tsx` | Top5/Bottom5 に加え、全エリアを偏差値順で一覧表示。初期20件表示 + 展開ボタン |

---

## B7 進捗: 治安エリアマップ

トップページに東京都全域の治安偏差値カラーグラデーションマップを独立セクションとして追加。

### 実装内容

| # | タスク | ファイル | 内容 |
|---|--------|---------|------|
| B7-1 | API Route | `app/api/area-geojson/route.ts` | Supabase RPC `get_area_geojson()` からページネーション（1,000件/回）で全5,075エリアを取得。GeoJSON FeatureCollection を返却。`Cache-Control: max-age=86400` |
| B7-2 | マップコンポーネント | `AreaMap.tsx`, `AreaMapInner.tsx` | react-leaflet GeoJSON レイヤーで偏差値カラーポリゴン描画。dynamic import（SSR無効） |
| B7-3 | カラーグラデーション | `AreaMapInner.tsx` | 偏差値 0→赤(hue=0), 27→黄(hue=60), 55→緑(hue=120) の HSL 線形補間 |
| B7-4 | スコアフィルタリング | `AreaMapInner.tsx` | 6段階フィルタボタン（すべて / ~30 / 30-40 / 40-45 / 45-50 / 50-55） |
| B7-5 | 凡例 | `AreaMapInner.tsx` | Leaflet L.Control で右下にカラースケールバー表示 |

### 解決した問題

| 問題 | 原因 | 修正 |
|------|------|------|
| 色分けが均一 | scoreToColor が 30-70 レンジだが実データは 0-54.9（72%が50-55） | 0-55 レンジに修正 |
| 484エリア非表示 | boundary が NULL（centroid のみ） | RPC に `ST_Buffer(centroid, 0.002)` で小円ポリゴン生成を追加 |
| 50-55 以外フィルタが空 | Supabase PostgREST のデフォルト1,000行制限 | API Route でページネーション実装（`.range()` ループ） |
| ブラウザキャッシュ | 旧1,000件レスポンスが `max-age=86400` でキャッシュ | fetch に `cache: 'no-cache'` 追加 |

---

## B8 進捗: Vibeデータ丁目単位化

駅単位の `vibe_data` から丁目単位の `area_vibe_data` に移行。e-Stat 小地域集計（国勢調査）で丁目レベルの人口統計を取得し、Overpass API で施設データを取得。

### DB

| テーブル | 内容 | 件数 |
|---------|------|------|
| `areas` | 丁目マスタ（Shapefile 由来） | 5,064 |
| `area_vibe_data` | 丁目別 Vibe データ | 5,064 |

### パイプライン

| スクリプト | 用途 | 状態 |
|-----------|------|------|
| `00_build_area_master.py` | Shapefile → areas テーブル投入（ポリゴンマージ対応） | ✅ 実行済み |
| `04_fetch_vibe.py` | 丁目単位フローに書き換え（`--resume` で途中再開対応） | ✅ 実行済み |

### e-Stat 小地域集計データセット

| データ | statsDataId | cat01 コード |
|--------|-------------|-------------|
| 年齢（5歳階級）別人口 | `8003006792` | 0010=総数, 0050-0080=若年, 0090-0140=家族, 0150=65歳以上 |
| 世帯人員別一般世帯数 | `8003006803` | 0010=総世帯, 0020=単身 |
| 昼夜間人口比 | `0003454499` | 市区町村レベルのみ（丁目にフォールバック） |

### 修正したバグ

| バグ | 原因 | 修正 |
|------|------|------|
| elderly_ratio が常に 0 | cat01 コード `0190` は存在しない | `0150`（65歳以上）に修正 |
| area_name 重複で UPSERT 失敗 | Shapefile に同一丁目の複数ポリゴン | `unary_union` でマージ（5,400→5,064） |
| select_all が 1,000件で打ち切り | Supabase デフォルト制限 | `.range()` ページネーション追加 |

### フロントエンド

| ファイル | 変更 |
|---------|------|
| `packages/shared/src/types/vibe.ts` | `VibeData` 型削除、`AreaVibeData` 型に統一 |
| `packages/shared/src/index.ts` | `VibeData` の re-export 削除 |
| `apps/web/lib/db.ts` | `getAreaVibe(areaName)` 追加。`getStationVibe`, `getTopStations`, `getBottomStations` 削除 |
| `apps/web/lib/constants.ts` | `SITE_DESCRIPTION` に「エリア・駅単位」表記。`MAX_COMPARE_STATIONS` → `MAX_COMPARE_AREAS` |
| `apps/web/app/area/[slug]/page.tsx` | Vibe セクション表示追加。型を `AreaVibeData` に変更 |
| `apps/web/app/station/[slug]/page.tsx` | Vibe セクション削除（エリアページに移行）。description 更新 |
| `apps/web/components/station/VibeSection.tsx` | props 型を `VibeData` → `AreaVibeData` に変更 |
| `apps/web/app/compare/CompareContent.tsx` | 駅比較→エリア比較に全面リファクタ。`town_crimes` + `area_vibe_data` を直接参照 |
| `apps/web/app/compare/page.tsx` | metadata を「駅比較」→「エリア比較」に変更 |

### パイプライン微修正

| ファイル | 変更 |
|---------|------|
| `pipeline/lib/crime_parser.py` | 町丁目名の正規化・パーサー改善 |
| `pipeline/scripts/01_fetch_stations.py` | 軽微な修正 |
| `pipeline/scripts/02_fetch_safety.py` | 軽微な修正 |
| `pipeline/scripts/07_geocode_missing_areas.py` | ジオコーディング処理の改善 |
