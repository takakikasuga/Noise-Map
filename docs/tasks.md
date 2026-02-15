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
| A6 | Next.js ページ実装 | A0,A1 | 駅ページUI・SSG generateStaticParams・比較ページ。659駅の静的ページ生成完了。Safety/Vibeセクション実データ表示、検索オートコンプリート、比較テーブル実装済み | ✅ |
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

### Week 2: フロントエンド実装
- 駅ページのUI実装（Safety/Hazard/Vibeセクション）
- 地図コンポーネント（Leaflet）実装
- スコアゲージ・グラフ表示
- 比較ページ実装

### Week 3: UGC・SEO・デプロイ
- UGC投稿・表示機能
- SEO最適化（metadata, OGP, structured data）
- Vercelデプロイ・ドメイン設定
- 動作テスト・パフォーマンス最適化

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
