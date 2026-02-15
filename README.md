# ヒッコシマップ

東京都全域の住環境リスク情報を駅単位で可視化する Web サービスです。

## 技術スタック

- **モノレポ管理**: Turborepo + pnpm workspaces
- **フロントエンド**: Next.js 15 (App Router)
- **地図**: Leaflet
- **バックエンド / DB**: Supabase (PostgreSQL + PostGIS)
- **データ取得**: Python (e-Stat API, 不動産情報ライブラリ API)
- **ホスティング**: Vercel

## ディレクトリ構成

```
noise-map/
├── apps/
│   └── web/              # Next.js フロントエンド
├── packages/
│   ├── shared/           # 共有型定義・定数
│   ├── ui/               # 共通 UI コンポーネント
│   └── supabase/         # Supabase スキーマ・クライアント
├── pipeline/             # Python データパイプライン
├── turbo.json            # Turborepo 設定
├── pnpm-workspace.yaml   # pnpm ワークスペース定義
├── package.json          # ルート package.json
├── .env.example          # 環境変数テンプレート
└── .gitignore
```

## セットアップ

### 前提条件

- Node.js 20 以上
- pnpm 9 以上

### 手順

1. リポジトリをクローン

   ```bash
   git clone <repository-url>
   cd noise-map
   ```

2. 依存関係をインストール

   ```bash
   pnpm install
   ```

3. 環境変数を設定

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` に各 API キーを記入してください。

4. 開発サーバーを起動

   ```bash
   pnpm dev
   ```

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `pnpm dev` | 開発サーバーを起動 |
| `pnpm build` | 全パッケージをビルド |
| `pnpm lint` | ESLint を実行 |
| `pnpm type-check` | TypeScript 型チェックを実行 |
| `pnpm format` | Prettier でコードを整形 |
