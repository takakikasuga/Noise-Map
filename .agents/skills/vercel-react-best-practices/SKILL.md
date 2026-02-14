---
name: vercel-react-best-practices
description: Vercel Engineering による React および Next.js のパフォーマンス最適化ガイドラインです。このスキルは、React/Next.js コードの作成、レビュー、リファクタリング時に最適なパフォーマンスパターンを確保するために使用してください。React コンポーネント、Next.js ページ、データフェッチ、バンドル最適化、パフォーマンス改善に関連するタスクでトリガーされます。
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React ベストプラクティス

Vercel がメンテナンスする、React および Next.js アプリケーション向けの包括的なパフォーマンス最適化ガイドです。8つのカテゴリにまたがる57のルールを含み、自動リファクタリングやコード生成をガイドするために影響度順に優先度付けされています。

## 適用するタイミング

以下の場合にこのガイドラインを参照してください：
- 新しい React コンポーネントや Next.js ページを作成する場合
- データフェッチ（クライアントサイドまたはサーバーサイド）を実装する場合
- パフォーマンスの問題についてコードをレビューする場合
- 既存の React/Next.js コードをリファクタリングする場合
- バンドルサイズやロード時間を最適化する場合

## 優先度別ルールカテゴリ

| 優先度 | カテゴリ | 影響度 | プレフィックス |
|--------|----------|--------|----------------|
| 1 | ウォーターフォールの排除 | CRITICAL | `async-` |
| 2 | バンドルサイズの最適化 | CRITICAL | `bundle-` |
| 3 | サーバーサイドのパフォーマンス | HIGH | `server-` |
| 4 | クライアントサイドのデータフェッチ | MEDIUM-HIGH | `client-` |
| 5 | 再レンダリングの最適化 | MEDIUM | `rerender-` |
| 6 | レンダリングパフォーマンス | MEDIUM | `rendering-` |
| 7 | JavaScript パフォーマンス | LOW-MEDIUM | `js-` |
| 8 | 高度なパターン | LOW | `advanced-` |

## クイックリファレンス

### 1. ウォーターフォールの排除（CRITICAL）

- `async-defer-await` - await を実際に使用する分岐に移動する
- `async-parallel` - 独立した操作に Promise.all() を使用する
- `async-dependencies` - 部分的な依存関係に better-all を使用する
- `async-api-routes` - API ルートで Promise を早期に開始し、遅延して await する
- `async-suspense-boundaries` - Suspense を使用してコンテンツをストリーミングする

### 2. バンドルサイズの最適化（CRITICAL）

- `bundle-barrel-imports` - 直接インポートし、バレルファイルを避ける
- `bundle-dynamic-imports` - 重いコンポーネントに next/dynamic を使用する
- `bundle-defer-third-party` - アナリティクス/ロギングをハイドレーション後にロードする
- `bundle-conditional` - 機能が有効化された場合のみモジュールをロードする
- `bundle-preload` - ホバー/フォーカス時にプリロードして体感速度を向上させる

### 3. サーバーサイドのパフォーマンス（HIGH）

- `server-auth-actions` - Server Actions を API ルートと同様に認証する
- `server-cache-react` - React.cache() でリクエスト単位の重複排除を行う
- `server-cache-lru` - クロスリクエストキャッシュに LRU キャッシュを使用する
- `server-dedup-props` - RSC props での重複シリアライズを避ける
- `server-serialization` - クライアントコンポーネントに渡すデータを最小化する
- `server-parallel-fetching` - コンポーネントを再構成してフェッチを並列化する
- `server-after-nonblocking` - ノンブロッキング処理に after() を使用する

### 4. クライアントサイドのデータフェッチ（MEDIUM-HIGH）

- `client-swr-dedup` - SWR で自動リクエスト重複排除を行う
- `client-event-listeners` - グローバルイベントリスナーを重複排除する
- `client-passive-event-listeners` - スクロール用にパッシブリスナーを使用する
- `client-localstorage-schema` - localStorage データのバージョン管理と最小化

### 5. 再レンダリングの最適化（MEDIUM）

- `rerender-defer-reads` - コールバック内でのみ使用する state をサブスクライブしない
- `rerender-memo` - 高コストな処理をメモ化コンポーネントに抽出する
- `rerender-memo-with-default-value` - デフォルトの非プリミティブ props を巻き上げる
- `rerender-dependencies` - エフェクトにプリミティブな依存関係を使用する
- `rerender-derived-state` - 生の値ではなく派生されたブール値をサブスクライブする
- `rerender-derived-state-no-effect` - エフェクトではなくレンダリング中に state を導出する
- `rerender-functional-setstate` - 安定したコールバックのために関数型 setState を使用する
- `rerender-lazy-state-init` - 高コストな値には useState に関数を渡す
- `rerender-simple-expression-in-memo` - 単純なプリミティブに memo を使わない
- `rerender-move-effect-to-event` - インタラクションロジックをイベントハンドラに配置する
- `rerender-transitions` - 緊急でない更新に startTransition を使用する
- `rerender-use-ref-transient-values` - 一時的な頻繁な値に ref を使用する

### 6. レンダリングパフォーマンス（MEDIUM）

- `rendering-animate-svg-wrapper` - SVG 要素ではなく div ラッパーをアニメーションする
- `rendering-content-visibility` - 長いリストに content-visibility を使用する
- `rendering-hoist-jsx` - 静的な JSX をコンポーネントの外に抽出する
- `rendering-svg-precision` - SVG 座標の精度を下げる
- `rendering-hydration-no-flicker` - クライアント専用データにインラインスクリプトを使用する
- `rendering-hydration-suppress-warning` - 想定されるミスマッチを抑制する
- `rendering-activity` - 表示/非表示に Activity コンポーネントを使用する
- `rendering-conditional-render` - 条件付きレンダリングに && ではなく三項演算子を使用する
- `rendering-usetransition-loading` - ローディング state に useTransition を優先する

### 7. JavaScript パフォーマンス（LOW-MEDIUM）

- `js-batch-dom-css` - クラスや cssText で CSS 変更をグループ化する
- `js-index-maps` - 繰り返しの検索用に Map を構築する
- `js-cache-property-access` - ループ内でオブジェクトプロパティをキャッシュする
- `js-cache-function-results` - モジュールレベルの Map で関数結果をキャッシュする
- `js-cache-storage` - localStorage/sessionStorage の読み取りをキャッシュする
- `js-combine-iterations` - 複数の filter/map を1つのループにまとめる
- `js-length-check-first` - 高コストな比較の前に配列の長さをチェックする
- `js-early-exit` - 関数から早期リターンする
- `js-hoist-regexp` - RegExp の生成をループの外に巻き上げる
- `js-min-max-loop` - ソートの代わりにループで min/max を求める
- `js-set-map-lookups` - O(1) ルックアップに Set/Map を使用する
- `js-tosorted-immutable` - イミュータビリティのために toSorted() を使用する

### 8. 高度なパターン（LOW）

- `advanced-event-handler-refs` - イベントハンドラを ref に格納する
- `advanced-init-once` - アプリの読み込み時に一度だけ初期化する
- `advanced-use-latest` - 安定したコールバック ref に useLatest を使用する

## 使い方

詳細な説明とコード例については、個別のルールファイルを参照してください：

```
rules/async-parallel.md
rules/bundle-barrel-imports.md
```

各ルールファイルには以下が含まれています：
- なぜ重要かの簡潔な説明
- 説明付きの誤ったコード例
- 説明付きの正しいコード例
- 追加のコンテキストと参考文献

## 完全なコンパイル済みドキュメント

すべてのルールが展開された完全なガイドは `AGENTS.md` を参照してください。
