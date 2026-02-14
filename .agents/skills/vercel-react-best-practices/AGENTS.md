# React ベストプラクティス

**Version 1.0.0**
Vercel Engineering
2026年1月

> **注意:**
> このドキュメントは主にエージェントおよび LLM が React と Next.js のコードベースを保守、
> 生成、リファクタリングする際に従うためのものです。人間にとっても有用ですが、
> ここでのガイダンスは AI アシストワークフローによる自動化と一貫性のために最適化されています。

---

## 概要

React および Next.js アプリケーション向けの包括的なパフォーマンス最適化ガイドです。AI エージェントおよび LLM 向けに設計されています。8つのカテゴリにまたがる40以上のルールを含み、影響度の高いもの（ウォーターフォールの排除、バンドルサイズの削減）から段階的なもの（高度なパターン）まで優先度付けされています。各ルールには詳細な説明、誤りと正しい実装を比較する実例、自動リファクタリングとコード生成をガイドするための具体的な影響度の指標が含まれています。

---

## 目次

1. [ウォーターフォールの排除](#1-eliminating-waterfalls) — **CRITICAL**
   - 1.1 [await の遅延実行](#11-defer-await-until-needed)
   - 1.2 [依存関係ベースの並列化](#12-dependency-based-parallelization)
   - 1.3 [API ルートでのウォーターフォールチェーン防止](#13-prevent-waterfall-chains-in-api-routes)
   - 1.4 [独立した操作に対する Promise.all()](#14-promiseall-for-independent-operations)
   - 1.5 [戦略的な Suspense バウンダリ](#15-strategic-suspense-boundaries)
2. [バンドルサイズの最適化](#2-bundle-size-optimization) — **CRITICAL**
   - 2.1 [バレルファイルインポートの回避](#21-avoid-barrel-file-imports)
   - 2.2 [条件付きモジュールロード](#22-conditional-module-loading)
   - 2.3 [重要でないサードパーティライブラリの遅延ロード](#23-defer-non-critical-third-party-libraries)
   - 2.4 [重いコンポーネントの動的インポート](#24-dynamic-imports-for-heavy-components)
   - 2.5 [ユーザーの意図に基づくプリロード](#25-preload-based-on-user-intent)
3. [サーバーサイドのパフォーマンス](#3-server-side-performance) — **HIGH**
   - 3.1 [Server Actions を API ルートと同様に認証する](#31-authenticate-server-actions-like-api-routes)
   - 3.2 [RSC Props での重複シリアライズの回避](#32-avoid-duplicate-serialization-in-rsc-props)
   - 3.3 [クロスリクエスト LRU キャッシュ](#33-cross-request-lru-caching)
   - 3.4 [RSC バウンダリでのシリアライズの最小化](#34-minimize-serialization-at-rsc-boundaries)
   - 3.5 [コンポーネント合成による並列データフェッチ](#35-parallel-data-fetching-with-component-composition)
   - 3.6 [React.cache() によるリクエスト単位の重複排除](#36-per-request-deduplication-with-reactcache)
   - 3.7 [ノンブロッキング処理に after() を使用する](#37-use-after-for-non-blocking-operations)
4. [クライアントサイドのデータフェッチ](#4-client-side-data-fetching) — **MEDIUM-HIGH**
   - 4.1 [グローバルイベントリスナーの重複排除](#41-deduplicate-global-event-listeners)
   - 4.2 [スクロールパフォーマンスのためのパッシブイベントリスナー](#42-use-passive-event-listeners-for-scrolling-performance)
   - 4.3 [SWR による自動重複排除](#43-use-swr-for-automatic-deduplication)
   - 4.4 [localStorage データのバージョン管理と最小化](#44-version-and-minimize-localstorage-data)
5. [再レンダリングの最適化](#5-re-render-optimization) — **MEDIUM**
   - 5.1 [レンダリング中に派生 state を計算する](#51-calculate-derived-state-during-rendering)
   - 5.2 [state の読み取りを使用箇所まで遅延させる](#52-defer-state-reads-to-usage-point)
   - 5.3 [プリミティブな結果型の単純な式を useMemo でラップしない](#53-do-not-wrap-a-simple-expression-with-a-primitive-result-type-in-usememo)
   - 5.4 [メモ化コンポーネントのデフォルト非プリミティブパラメータ値を定数に抽出する](#54-extract-default-non-primitive-parameter-value-from-memoized-component-to-constant)
   - 5.5 [メモ化コンポーネントへの抽出](#55-extract-to-memoized-components)
   - 5.6 [エフェクト依存関係の絞り込み](#56-narrow-effect-dependencies)
   - 5.7 [インタラクションロジックをイベントハンドラに配置する](#57-put-interaction-logic-in-event-handlers)
   - 5.8 [派生 state のサブスクライブ](#58-subscribe-to-derived-state)
   - 5.9 [関数型 setState 更新を使用する](#59-use-functional-setstate-updates)
   - 5.10 [state の遅延初期化を使用する](#510-use-lazy-state-initialization)
   - 5.11 [緊急でない更新に Transitions を使用する](#511-use-transitions-for-non-urgent-updates)
   - 5.12 [一時的な値に useRef を使用する](#512-use-useref-for-transient-values)
6. [レンダリングパフォーマンス](#6-rendering-performance) — **MEDIUM**
   - 6.1 [SVG 要素ではなく SVG ラッパーをアニメーションする](#61-animate-svg-wrapper-instead-of-svg-element)
   - 6.2 [長いリストに CSS content-visibility を使用する](#62-css-content-visibility-for-long-lists)
   - 6.3 [静的な JSX 要素を巻き上げる](#63-hoist-static-jsx-elements)
   - 6.4 [SVG の精度を最適化する](#64-optimize-svg-precision)
   - 6.5 [ちらつきなしでハイドレーションミスマッチを防止する](#65-prevent-hydration-mismatch-without-flickering)
   - 6.6 [想定されるハイドレーションミスマッチを抑制する](#66-suppress-expected-hydration-mismatches)
   - 6.7 [表示/非表示に Activity コンポーネントを使用する](#67-use-activity-component-for-showhide)
   - 6.8 [明示的な条件付きレンダリングを使用する](#68-use-explicit-conditional-rendering)
   - 6.9 [手動ローディング state の代わりに useTransition を使用する](#69-use-usetransition-over-manual-loading-states)
7. [JavaScript パフォーマンス](#7-javascript-performance) — **LOW-MEDIUM**
   - 7.1 [レイアウトスラッシングの回避](#71-avoid-layout-thrashing)
   - 7.2 [繰り返しの検索用にインデックス Map を構築する](#72-build-index-maps-for-repeated-lookups)
   - 7.3 [ループ内でプロパティアクセスをキャッシュする](#73-cache-property-access-in-loops)
   - 7.4 [繰り返しの関数呼び出しをキャッシュする](#74-cache-repeated-function-calls)
   - 7.5 [Storage API 呼び出しをキャッシュする](#75-cache-storage-api-calls)
   - 7.6 [複数の配列イテレーションを結合する](#76-combine-multiple-array-iterations)
   - 7.7 [配列比較の前に長さをチェックする](#77-early-length-check-for-array-comparisons)
   - 7.8 [関数からの早期リターン](#78-early-return-from-functions)
   - 7.9 [RegExp の生成を巻き上げる](#79-hoist-regexp-creation)
   - 7.10 [ソートの代わりにループで Min/Max を求める](#710-use-loop-for-minmax-instead-of-sort)
   - 7.11 [O(1) ルックアップに Set/Map を使用する](#711-use-setmap-for-o1-lookups)
   - 7.12 [イミュータビリティのために sort() の代わりに toSorted() を使用する](#712-use-tosorted-instead-of-sort-for-immutability)
8. [高度なパターン](#8-advanced-patterns) — **LOW**
   - 8.1 [アプリの初期化をマウントごとではなく一度だけ行う](#81-initialize-app-once-not-per-mount)
   - 8.2 [イベントハンドラを Ref に格納する](#82-store-event-handlers-in-refs)
   - 8.3 [安定したコールバック Ref に useEffectEvent を使用する](#83-useeffectevent-for-stable-callback-refs)

---

## 1. ウォーターフォールの排除

**影響度: CRITICAL**

ウォーターフォールはパフォーマンス低下の最大の原因である。逐次的な await のたびにネットワークレイテンシがそのまま加算される。これを排除することで最大の改善効果が得られる。

### 1.1 await の遅延実行

**影響度: HIGH（使用されないコードパスのブロックを回避）**

`await` 操作を実際に使用される分岐に移動し、不要なコードパスのブロックを避ける。

**誤り: 両方の分岐をブロックする**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    // Returns immediately but still waited for userData
    return { skipped: true }
  }

  // Only this branch uses userData
  return processUserData(userData)
}
```

**正しい: 必要なときだけブロックする**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // Returns immediately without waiting
    return { skipped: true }
  }

  // Fetch only when needed
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

**別の例: 早期リターンの最適化**

```typescript
// Incorrect: always fetches permissions
async function updateResource(resourceId: string, userId: string) {
  const permissions = await fetchPermissions(userId)
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: 'Not found' }
  }

  if (!permissions.canEdit) {
    return { error: 'Forbidden' }
  }

  return await updateResourceData(resource, permissions)
}

// Correct: fetches only when needed
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: 'Not found' }
  }

  const permissions = await fetchPermissions(userId)

  if (!permissions.canEdit) {
    return { error: 'Forbidden' }
  }

  return await updateResourceData(resource, permissions)
}
```

この最適化は、スキップされる分岐が頻繁に実行される場合や、遅延される操作がコストの高い場合に特に有効である。

### 1.2 依存関係ベースの並列化

**影響度: CRITICAL（2〜10倍の改善）**

部分的な依存関係を持つ操作には、`better-all` を使用して並列性を最大化する。各タスクを可能な限り早いタイミングで自動的に開始する。

**誤り: profile が config を不必要に待機する**

```typescript
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)
```

**正しい: config と profile が並列実行される**

```typescript
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() { return fetchUser() },
  async config() { return fetchConfig() },
  async profile() {
    return fetchProfile((await this.$.user).id)
  }
})
```

**追加の依存関係なしの代替方法:**

```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise
])
```

すべての Promise を先に作成し、最後に `Promise.all()` を実行する方法もある。

参考文献: [https://github.com/shuding/better-all](https://github.com/shuding/better-all)

### 1.3 API ルートでのウォーターフォールチェーン防止

**影響度: CRITICAL（2〜10倍の改善）**

API ルートや Server Actions では、まだ await しなくても、独立した操作は直ちに開始する。

**誤り: config が auth を待ち、data が両方を待つ**

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**正しい: auth と config が直ちに開始される**

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

より複雑な依存関係チェーンを持つ操作には、`better-all` を使用して自動的に並列性を最大化する（依存関係ベースの並列化を参照）。

### 1.4 独立した操作に対する Promise.all()

**影響度: CRITICAL（2〜10倍の改善）**

非同期操作に相互依存がない場合、`Promise.all()` を使用して並行実行する。

**誤り: 逐次実行、3回のラウンドトリップ**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**正しい: 並列実行、1回のラウンドトリップ**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```

### 1.5 戦略的な Suspense バウンダリ

**影響度: HIGH（初回描画の高速化）**

非同期コンポーネントで JSX を返す前にデータを await するのではなく、Suspense バウンダリを使用してデータのロード中にラッパー UI を先に表示する。

**誤り: ラッパーがデータフェッチによりブロックされる**

```tsx
async function Page() {
  const data = await fetchData() // Blocks entire page

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <DataDisplay data={data} />
      </div>
      <div>Footer</div>
    </div>
  )
}
```

データを必要とするのは中央のセクションだけなのに、レイアウト全体がデータを待機してしまう。

**正しい: ラッパーが即座に表示され、データがストリーミングされる**

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // Only blocks this component
  return <div>{data.content}</div>
}
```

Sidebar、Header、Footer は即座にレンダリングされる。DataDisplay だけがデータを待機する。

**代替方法: コンポーネント間で Promise を共有する**

```tsx
function Page() {
  // Start fetch immediately, but don't await
  const dataPromise = fetchData()

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay dataPromise={dataPromise} />
        <DataSummary dataPromise={dataPromise} />
      </Suspense>
      <div>Footer</div>
    </div>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // Unwraps the promise
  return <div>{data.content}</div>
}

function DataSummary({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // Reuses the same promise
  return <div>{data.summary}</div>
}
```

両方のコンポーネントが同じ Promise を共有するため、フェッチは1回だけ実行される。レイアウトは即座にレンダリングされ、両方のコンポーネントが一緒に待機する。

**このパターンを使用すべきでない場合:**

- レイアウト判断に必要な重要データ（配置に影響する場合）

- ファーストビューの SEO に重要なコンテンツ

- Suspense のオーバーヘッドに見合わない小さく高速なクエリ

- レイアウトシフトを避けたい場合（ローディング → コンテンツのジャンプ）

**トレードオフ:** 初回描画の高速化とレイアウトシフトの可能性のバランス。UX の優先事項に基づいて判断すること。

---

## 2. バンドルサイズの最適化

**影響度: CRITICAL**

初期バンドルサイズを削減することで、Time to Interactive と Largest Contentful Paint が改善される。

### 2.1 Barrel File インポートを避ける

**影響度: CRITICAL（インポートコスト200-800ms、ビルド低速化）**

未使用モジュールの大量読み込みを防ぐため、barrel file ではなくソースファイルから直接インポートする。**Barrel file** とは、複数のモジュールを再エクスポートするエントリーポイント（例: `export * from './module'` を行う `index.js`）のことである。

人気のあるアイコン・コンポーネントライブラリでは、エントリーファイルに**最大10,000件の再エクスポート**が含まれることがある。多くの React パッケージでは、**インポートだけで200-800msかかり**、開発速度と本番のコールドスタートの両方に影響する。

**tree-shaking が効かない理由:** ライブラリが external（バンドル対象外）としてマークされている場合、バンドラーは最適化できない。tree-shaking を有効にするためにバンドルすると、モジュールグラフ全体の解析によりビルドが大幅に遅くなる。

**誤り: ライブラリ全体をインポート**

```tsx
import { Check, X, Menu } from 'lucide-react'
// Loads 1,583 modules, takes ~2.8s extra in dev
// Runtime cost: 200-800ms on every cold start

import { Button, TextField } from '@mui/material'
// Loads 2,225 modules, takes ~4.2s extra in dev
```

**正しい: 必要なものだけをインポート**

```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// Loads only 3 modules (~2KB vs ~1MB)

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
// Loads only what you use
```

**代替手段: Next.js 13.5+**

```js
// next.config.js - use optimizePackageImports
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material']
  }
}

// Then you can keep the ergonomic barrel imports:
import { Check, X, Menu } from 'lucide-react'
// Automatically transformed to direct imports at build time
```

直接インポートにより、開発環境の起動が15-70%高速化、ビルドが28%高速化、コールドスタートが40%高速化し、HMRも大幅に高速化される。

影響を受けやすいライブラリ: `lucide-react`, `@mui/material`, `@mui/icons-material`, `@tabler/icons-react`, `react-icons`, `@headlessui/react`, `@radix-ui/react-*`, `lodash`, `ramda`, `date-fns`, `rxjs`, `react-use`

参考文献: [https://vercel.com/blog/how-we-optimized-package-imports-in-next-js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)

### 2.2 条件付きモジュール読み込み

**影響度: HIGH（必要な時にのみ大きなデータを読み込む）**

機能が有効化された時にのみ、大きなデータやモジュールを読み込む。

**例: アニメーションフレームの遅延読み込み**

```tsx
function AnimationPlayer({ enabled, setEnabled }: { enabled: boolean; setEnabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== 'undefined') {
      import('./animation-frames.js')
        .then(mod => setFrames(mod.frames))
        .catch(() => setEnabled(false))
    }
  }, [enabled, frames, setEnabled])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

`typeof window !== 'undefined'` チェックにより、このモジュールが SSR 用にバンドルされるのを防ぎ、サーバーバンドルサイズとビルド速度を最適化する。

### 2.3 重要でないサードパーティライブラリの遅延読み込み

**影響度: MEDIUM（ハイドレーション後に読み込む）**

アナリティクス、ロギング、エラートラッキングはユーザーインタラクションをブロックしない。ハイドレーション後に読み込む。

**誤り: 初期バンドルをブロック**

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**正しい: ハイドレーション後に読み込み**

```tsx
import dynamic from 'next/dynamic'

const Analytics = dynamic(
  () => import('@vercel/analytics/react').then(m => m.Analytics),
  { ssr: false }
)

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2.4 重いコンポーネントの Dynamic Imports

**影響度: CRITICAL（TTI と LCP に直接影響）**

初期レンダリングに不要な大きなコンポーネントは `next/dynamic` を使って遅延読み込みする。

**誤り: Monaco がメインチャンクにバンドルされる（約300KB）**

```tsx
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**正しい: Monaco をオンデマンドで読み込み**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

### 2.5 ユーザーの意図に基づくプリロード

**影響度: MEDIUM（体感レイテンシーの削減）**

重いバンドルを必要になる前にプリロードし、体感レイテンシーを削減する。

**例: ホバー/フォーカス時にプリロード**

```tsx
function EditorButton({ onClick }: { onClick: () => void }) {
  const preload = () => {
    if (typeof window !== 'undefined') {
      void import('./monaco-editor')
    }
  }

  return (
    <button
      onMouseEnter={preload}
      onFocus={preload}
      onClick={onClick}
    >
      Open Editor
    </button>
  )
}
```

**例: フィーチャーフラグが有効な場合にプリロード**

```tsx
function FlagsProvider({ children, flags }: Props) {
  useEffect(() => {
    if (flags.editorEnabled && typeof window !== 'undefined') {
      void import('./monaco-editor').then(mod => mod.init())
    }
  }, [flags.editorEnabled])

  return <FlagsContext.Provider value={flags}>
    {children}
  </FlagsContext.Provider>
}
```

`typeof window !== 'undefined'` チェックにより、プリロード対象のモジュールが SSR 用にバンドルされるのを防ぎ、サーバーバンドルサイズとビルド速度を最適化する。

---

## 3. サーバーサイドパフォーマンス

**影響度: HIGH**

サーバーサイドレンダリングとデータフェッチを最適化することで、サーバーサイドのウォーターフォールを排除し、レスポンス時間を短縮する。

### 3.1 Server Actions を API ルートと同様に認証する

**影響度: CRITICAL（サーバーミューテーションへの不正アクセスを防止）**

Server Actions（`"use server"` を持つ関数）は、API ルートと同様にパブリックエンドポイントとして公開される。各 Server Action の**内部で**必ず認証と認可を検証すること。middleware、layout ガード、ページレベルのチェックだけに依存してはならない。Server Actions は直接呼び出すことができるためである。

Next.js のドキュメントには明記されている: 「Server Actions をパブリック向け API エンドポイントと同じセキュリティ考慮で扱い、ユーザーがミューテーションを実行する権限があるか検証してください。」

**誤り: 認証チェックなし**

```typescript
'use server'

export async function deleteUser(userId: string) {
  // Anyone can call this! No auth check
  await db.user.delete({ where: { id: userId } })
  return { success: true }
}
```

**正しい: アクション内部で認証**

```typescript
'use server'

import { verifySession } from '@/lib/auth'
import { unauthorized } from '@/lib/errors'

export async function deleteUser(userId: string) {
  // Always check auth inside the action
  const session = await verifySession()

  if (!session) {
    throw unauthorized('Must be logged in')
  }

  // Check authorization too
  if (session.user.role !== 'admin' && session.user.id !== userId) {
    throw unauthorized('Cannot delete other users')
  }

  await db.user.delete({ where: { id: userId } })
  return { success: true }
}
```

**入力バリデーション付き:**

```typescript
'use server'

import { verifySession } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email()
})

export async function updateProfile(data: unknown) {
  // Validate input first
  const validated = updateProfileSchema.parse(data)

  // Then authenticate
  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // Then authorize
  if (session.user.id !== validated.userId) {
    throw new Error('Can only update own profile')
  }

  // Finally perform the mutation
  await db.user.update({
    where: { id: validated.userId },
    data: {
      name: validated.name,
      email: validated.email
    }
  })

  return { success: true }
}
```

参考文献: [https://nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)

### 3.2 RSC Props での重複シリアライズを避ける

**影響度: LOW（重複シリアライズの回避によりネットワークペイロードを削減）**

RSC からクライアントへのシリアライズは、値ではなくオブジェクト参照で重複排除される。同じ参照 = 1回だけシリアライズ。新しい参照 = 再度シリアライズ。変換処理（`.toSorted()`, `.filter()`, `.map()`）はサーバーではなくクライアントで行う。

**誤り: 配列が重複する**

```tsx
// RSC: sends 6 strings (2 arrays × 3 items)
<ClientList usernames={usernames} usernamesOrdered={usernames.toSorted()} />
```

**正しい: 3つの文字列を送信**

```tsx
// RSC: send once
<ClientList usernames={usernames} />

// Client: transform there
'use client'
const sorted = useMemo(() => [...usernames].sort(), [usernames])
```

**ネストされた重複排除の挙動:**

```tsx
// string[] - duplicates everything
usernames={['a','b']} sorted={usernames.toSorted()} // sends 4 strings

// object[] - duplicates array structure only
users={[{id:1},{id:2}]} sorted={users.toSorted()} // sends 2 arrays + 2 unique objects (not 4)
```

重複排除は再帰的に動作する。影響度はデータ型により異なる:

- `string[]`, `number[]`, `boolean[]`: **影響度 HIGH** - 配列とすべてのプリミティブが完全に重複する

- `object[]`: **影響度 LOW** - 配列は重複するが、ネストされたオブジェクトは参照で重複排除される

**重複排除を破る操作: 新しい参照を生成する**

- 配列: `.toSorted()`, `.filter()`, `.map()`, `.slice()`, `[...arr]`

- オブジェクト: `{...obj}`, `Object.assign()`, `structuredClone()`, `JSON.parse(JSON.stringify())`

**その他の例:**

```tsx
// ❌ Bad
<C users={users} active={users.filter(u => u.active)} />
<C product={product} productName={product.name} />

// ✅ Good
<C users={users} />
<C product={product} />
// Do filtering/destructuring in client
```

**例外:** 変換が高コストな場合やクライアントが元データを必要としない場合は、派生データを渡してよい。

### 3.3 クロスリクエスト LRU キャッシュ

**影響度: HIGH（リクエストをまたいでキャッシュ）**

`React.cache()` は1つのリクエスト内でのみ動作する。連続するリクエスト間で共有されるデータ（ユーザーがボタンAをクリックした後にボタンBをクリックする場合など）には、LRU キャッシュを使用する。

**実装:**

```typescript
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000  // 5 minutes
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}

// Request 1: DB query, result cached
// Request 2: cache hit, no DB query
```

連続するユーザー操作が、数秒以内に同じデータを必要とする複数のエンドポイントにアクセスする場合に使用する。

**Vercel の [Fluid Compute](https://vercel.com/docs/fluid-compute) の場合:** 複数の同時リクエストが同じ関数インスタンスとキャッシュを共有できるため、LRU キャッシュは特に効果的である。Redis などの外部ストレージなしでリクエスト間でキャッシュが永続化される。

**従来のサーバーレスの場合:** 各呼び出しは分離して実行されるため、プロセス間キャッシュには Redis を検討すること。

参考文献: [https://github.com/isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache)

### 3.4 RSC 境界でのシリアライズを最小化する

**影響度: HIGH（データ転送サイズの削減）**

React の Server/Client 境界では、すべてのオブジェクトプロパティが文字列にシリアライズされ、HTML レスポンスと後続の RSC リクエストに埋め込まれる。このシリアライズされたデータはページサイズとロード時間に直接影響するため、**サイズは非常に重要である**。クライアントが実際に使用するフィールドのみを渡す。

**誤り: 50フィールドすべてをシリアライズ**

```tsx
async function Page() {
  const user = await fetchUser()  // 50 fields
  return <Profile user={user} />
}

'use client'
function Profile({ user }: { user: User }) {
  return <div>{user.name}</div>  // uses 1 field
}
```

**正しい: 1フィールドのみシリアライズ**

```tsx
async function Page() {
  const user = await fetchUser()
  return <Profile name={user.name} />
}

'use client'
function Profile({ name }: { name: string }) {
  return <div>{name}</div>
}
```

### 3.5 コンポーネント合成によるデータフェッチの並列化

**影響度: CRITICAL（サーバーサイドのウォーターフォールを排除）**

React Server Components はツリー内で順次実行される。コンポーネント合成で再構成し、データフェッチを並列化する。

**誤り: Sidebar は Page のフェッチ完了を待つ**

```tsx
export default async function Page() {
  const header = await fetchHeader()
  return (
    <div>
      <div>{header}</div>
      <Sidebar />
    </div>
  )
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}
```

**正しい: 両方が同時にフェッチ**

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}</div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

export default function Page() {
  return (
    <div>
      <Header />
      <Sidebar />
    </div>
  )
}
```

**children prop を使った代替パターン:**

```tsx
async function Header() {
  const data = await fetchHeader()
  return <div>{data}</div>
}

async function Sidebar() {
  const items = await fetchSidebarItems()
  return <nav>{items.map(renderItem)}</nav>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Header />
      {children}
    </div>
  )
}

export default function Page() {
  return (
    <Layout>
      <Sidebar />
    </Layout>
  )
}
```

### 3.6 React.cache() によるリクエスト単位の重複排除

**影響度: MEDIUM（リクエスト内での重複排除）**

サーバーサイドのリクエスト重複排除には `React.cache()` を使用する。認証やデータベースクエリが最も恩恵を受ける。

**使い方:**

```typescript
import { cache } from 'react'

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return await db.user.findUnique({
    where: { id: session.user.id }
  })
})
```

単一のリクエスト内では、`getCurrentUser()` を複数回呼び出してもクエリは1回しか実行されない。

**引数にインラインオブジェクトを使わない:**

`React.cache()` はキャッシュヒットの判定に浅い等価性（`Object.is`）を使用する。インラインオブジェクトは呼び出しごとに新しい参照を生成するため、キャッシュヒットしない。

**誤り: 常にキャッシュミス**

```typescript
const getUser = cache(async (params: { uid: number }) => {
  return await db.user.findUnique({ where: { id: params.uid } })
})

// Each call creates new object, never hits cache
getUser({ uid: 1 })
getUser({ uid: 1 })  // Cache miss, runs query again
```

**正しい: キャッシュヒット**

```typescript
const params = { uid: 1 }
getUser(params)  // Query runs
getUser(params)  // Cache hit (same reference)
```

オブジェクトを渡す必要がある場合は、同じ参照を渡すこと。

**Next.js 固有の注意事項:**

Next.js では、`fetch` API にリクエストメモ化が自動的に拡張されている。同じ URL とオプションを持つリクエストは、単一のリクエスト内で自動的に重複排除されるため、`fetch` 呼び出しに `React.cache()` は不要である。ただし、以下のような他の非同期タスクには `React.cache()` が依然として不可欠である:

- データベースクエリ（Prisma, Drizzle など）

- 重い計算処理

- 認証チェック

- ファイルシステム操作

- `fetch` 以外のあらゆる非同期処理

これらの操作をコンポーネントツリー全体で重複排除するために `React.cache()` を使用する。

参考文献: [https://react.dev/reference/react/cache](https://react.dev/reference/react/cache)

### 3.7 after() でノンブロッキング処理を行う

**影響度: MEDIUM（レスポンス時間の高速化）**

Next.js の `after()` を使って、レスポンス送信後に実行すべき処理をスケジュールする。これにより、ロギング、アナリティクス、その他の副作用がレスポンスをブロックするのを防ぐ。

**誤り: レスポンスをブロック**

```tsx
import { logUserAction } from '@/app/utils'

export async function POST(request: Request) {
  // Perform mutation
  await updateDatabase(request)

  // Logging blocks the response
  const userAgent = request.headers.get('user-agent') || 'unknown'
  await logUserAction({ userAgent })

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**正しい: ノンブロッキング**

```tsx
import { after } from 'next/server'
import { headers, cookies } from 'next/headers'
import { logUserAction } from '@/app/utils'

export async function POST(request: Request) {
  // Perform mutation
  await updateDatabase(request)

  // Log after response is sent
  after(async () => {
    const userAgent = (await headers()).get('user-agent') || 'unknown'
    const sessionCookie = (await cookies()).get('session-id')?.value || 'anonymous'

    logUserAction({ sessionCookie, userAgent })
  })

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

レスポンスは即座に送信され、ロギングはバックグラウンドで実行される。

**一般的なユースケース:**

- アナリティクストラッキング

- 監査ログ

- 通知の送信

- キャッシュの無効化

- クリーンアップタスク

**重要な注意事項:**

- `after()` はレスポンスが失敗またはリダイレクトした場合でも実行される

- Server Actions、Route Handlers、Server Components で動作する

参考文献: [https://nextjs.org/docs/app/api-reference/functions/after](https://nextjs.org/docs/app/api-reference/functions/after)

---

## 4. クライアントサイドのデータフェッチ

**影響度: MEDIUM-HIGH**

自動的な重複排除と効率的なデータフェッチパターンにより、冗長なネットワークリクエストを削減できる。

### 4.1 グローバルイベントリスナーの重複排除

**影響度: LOW（Nコンポーネントに対してリスナー1つ）**

`useSWRSubscription()` を使用して、コンポーネントインスタンス間でグローバルイベントリスナーを共有する。

**誤り: Nインスタンス = Nリスナー**

```tsx
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === key) {
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback])
}
```

`useKeyboardShortcut` フックを複数回使用すると、各インスタンスが新しいリスナーを登録してしまう。

**正しい: Nインスタンス = 1リスナー**

```tsx
import useSWRSubscription from 'swr/subscription'

// Module-level Map to track callbacks per key
const keyCallbacks = new Map<string, Set<() => void>>()

function useKeyboardShortcut(key: string, callback: () => void) {
  // Register this callback in the Map
  useEffect(() => {
    if (!keyCallbacks.has(key)) {
      keyCallbacks.set(key, new Set())
    }
    keyCallbacks.get(key)!.add(callback)

    return () => {
      const set = keyCallbacks.get(key)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          keyCallbacks.delete(key)
        }
      }
    }
  }, [key, callback])

  useSWRSubscription('global-keydown', () => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && keyCallbacks.has(e.key)) {
        keyCallbacks.get(e.key)!.forEach(cb => cb())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })
}

function Profile() {
  // Multiple shortcuts will share the same listener
  useKeyboardShortcut('p', () => { /* ... */ })
  useKeyboardShortcut('k', () => { /* ... */ })
  // ...
}
```

### 4.2 スクロールパフォーマンスのために Passive イベントリスナーを使用する

**影響度: MEDIUM（イベントリスナーによるスクロール遅延を排除）**

タッチおよびホイールイベントリスナーに `{ passive: true }` を追加して、即座にスクロールを可能にする。ブラウザは通常、`preventDefault()` が呼ばれるかどうかを確認するためにリスナーの完了を待つため、スクロール遅延が発生する。

**誤り:**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  const handleWheel = (e: WheelEvent) => console.log(e.deltaY)

  document.addEventListener('touchstart', handleTouch)
  document.addEventListener('wheel', handleWheel)

  return () => {
    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('wheel', handleWheel)
  }
}, [])
```

**正しい:**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  const handleWheel = (e: WheelEvent) => console.log(e.deltaY)

  document.addEventListener('touchstart', handleTouch, { passive: true })
  document.addEventListener('wheel', handleWheel, { passive: true })

  return () => {
    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('wheel', handleWheel)
  }
}, [])
```

**passive を使うべき場合:** トラッキング/アナリティクス、ログ記録、`preventDefault()` を呼ばないすべてのリスナー。

**passive を使うべきでない場合:** カスタムスワイプジェスチャー、カスタムズームコントロール、または `preventDefault()` が必要なすべてのリスナー。

### 4.3 自動重複排除のために SWR を使用する

**影響度: MEDIUM-HIGH（自動重複排除）**

SWR は、コンポーネントインスタンス間でのリクエスト重複排除、キャッシュ、再検証を可能にする。

**誤り: 重複排除なし、各インスタンスがフェッチする**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])
}
```

**正しい: 複数インスタンスが1つのリクエストを共有する**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users } = useSWR('/api/users', fetcher)
}
```

**イミュータブルデータの場合:**

```tsx
import { useImmutableSWR } from '@/lib/swr'

function StaticContent() {
  const { data } = useImmutableSWR('/api/config', fetcher)
}
```

**ミューテーションの場合:**

```tsx
import { useSWRMutation } from 'swr/mutation'

function UpdateButton() {
  const { trigger } = useSWRMutation('/api/user', updateUser)
  return <button onClick={() => trigger()}>Update</button>
}
```

参考文献: [https://swr.vercel.app](https://swr.vercel.app)

### 4.4 localStorage データのバージョン管理と最小化

**影響度: MEDIUM（スキーマ競合の防止、ストレージサイズの削減）**

キーにバージョンプレフィックスを付け、必要なフィールドのみを保存する。スキーマ競合や機密データの意図しない保存を防止する。

**誤り:**

```typescript
// No version, stores everything, no error handling
localStorage.setItem('userConfig', JSON.stringify(fullUserObject))
const data = localStorage.getItem('userConfig')
```

**正しい:**

```typescript
const VERSION = 'v2'

function saveConfig(config: { theme: string; language: string }) {
  try {
    localStorage.setItem(`userConfig:${VERSION}`, JSON.stringify(config))
  } catch {
    // Throws in incognito/private browsing, quota exceeded, or disabled
  }
}

function loadConfig() {
  try {
    const data = localStorage.getItem(`userConfig:${VERSION}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// Migration from v1 to v2
function migrate() {
  try {
    const v1 = localStorage.getItem('userConfig:v1')
    if (v1) {
      const old = JSON.parse(v1)
      saveConfig({ theme: old.darkMode ? 'dark' : 'light', language: old.lang })
      localStorage.removeItem('userConfig:v1')
    }
  } catch {}
}
```

**サーバーレスポンスから最小限のフィールドのみ保存する:**

```typescript
// User object has 20+ fields, only store what UI needs
function cachePrefs(user: FullUser) {
  try {
    localStorage.setItem('prefs:v1', JSON.stringify({
      theme: user.preferences.theme,
      notifications: user.preferences.notifications
    }))
  } catch {}
}
```

**常に try-catch で囲むこと:** `getItem()` と `setItem()` は、シークレット/プライベートブラウジング（Safari、Firefox）、容量超過、または無効時にスローされる。

**メリット:** バージョニングによるスキーマ進化、ストレージサイズの削減、トークン/PII/内部フラグの保存防止。

---

## 5. 再レンダリングの最適化

**影響度: MEDIUM**

不要な再レンダリングを削減することで、無駄な計算を最小化し、UIの応答性を向上させる。

### 5.1 レンダリング中に派生 state を計算する

**影響度: MEDIUM（冗長なレンダリングと state の不整合を回避）**

現在の props/state から計算可能な値は、state に保存したりエフェクトで更新したりしない。レンダリング中に導出することで、余分なレンダリングと state の不整合を回避する。props の変更に反応するためだけにエフェクト内で state を設定しない。代わりに、派生値またはキーによるリセットを使用する。

**誤り: 冗長な state とエフェクト**

```tsx
function Form() {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    setFullName(firstName + ' ' + lastName)
  }, [firstName, lastName])

  return <p>{fullName}</p>
}
```

**正しい: レンダリング中に導出する**

```tsx
function Form() {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const fullName = firstName + ' ' + lastName

  return <p>{fullName}</p>
}
```

参考文献: [https://react.dev/learn/you-might-not-need-an-effect](https://react.dev/learn/you-might-not-need-an-effect)

### 5.2 state の読み取りを使用時まで遅延させる

**影響度: MEDIUM（不要なサブスクリプションを回避）**

コールバック内でのみ読み取る場合、動的な state（searchParams、localStorage など）をサブスクライブしない。

**誤り: すべての searchParams の変更をサブスクライブしてしまう**

```tsx
function ShareButton({ chatId }: { chatId: string }) {
  const searchParams = useSearchParams()

  const handleShare = () => {
    const ref = searchParams.get('ref')
    shareChat(chatId, { ref })
  }

  return <button onClick={handleShare}>Share</button>
}
```

**正しい: オンデマンドで読み取り、サブスクリプションなし**

```tsx
function ShareButton({ chatId }: { chatId: string }) {
  const handleShare = () => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    shareChat(chatId, { ref })
  }

  return <button onClick={handleShare}>Share</button>
}
```

### 5.3 プリミティブ型の結果を返す単純な式を useMemo で囲まない

**影響度: LOW-MEDIUM（毎レンダリングで無駄な計算が発生）**

式が単純（少数の論理演算・算術演算）で、結果がプリミティブ型（boolean、number、string）の場合、`useMemo` で囲まない。

`useMemo` の呼び出しとフック依存関係の比較は、式そのものよりも多くのリソースを消費する可能性がある。

**誤り:**

```tsx
function Header({ user, notifications }: Props) {
  const isLoading = useMemo(() => {
    return user.isLoading || notifications.isLoading
  }, [user.isLoading, notifications.isLoading])

  if (isLoading) return <Skeleton />
  // return some markup
}
```

**Correct:**

```tsx
function Header({ user, notifications }: Props) {
  const isLoading = user.isLoading || notifications.isLoading

  if (isLoading) return <Skeleton />
  // return some markup
}
```

### 5.4 メモ化コンポーネントのデフォルト非プリミティブパラメータ値を定数に抽出する

**影響度: MEDIUM（デフォルト値に定数を使用することでメモ化を復元する）**

メモ化コンポーネントが配列・関数・オブジェクトなどの非プリミティブなオプションパラメータにデフォルト値を持つ場合、そのパラメータを省略してコンポーネントを呼び出すとメモ化が壊れる。これは再レンダリングのたびに新しい値インスタンスが生成され、`memo()` の厳密等価比較を通過しないためである。

この問題に対処するには、デフォルト値を定数に抽出する。

**誤り: `onClick` が再レンダリングのたびに異なる値を持つ**

```tsx
const UserAvatar = memo(function UserAvatar({ onClick = () => {} }: { onClick?: () => void }) {
  // ...
})

// オプションの onClick を省略して使用
<UserAvatar />
```

**正しい: 安定したデフォルト値**

```tsx
const NOOP = () => {};

const UserAvatar = memo(function UserAvatar({ onClick = NOOP }: { onClick?: () => void }) {
  // ...
})

// オプションの onClick を省略して使用
<UserAvatar />
```

### 5.5 メモ化コンポーネントへの抽出

**影響度: MEDIUM（早期リターンを可能にする）**

コストの高い処理をメモ化コンポーネントに抽出することで、計算前の早期リターンを可能にする。

**誤り: ローディング中でもアバターを計算してしまう**

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}
```

**正しい: ローディング中は計算をスキップする**

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return (
    <div>
      <UserAvatar user={user} />
    </div>
  )
}
```

**注意:** プロジェクトで [React Compiler](https://react.dev/learn/react-compiler) が有効になっている場合、`memo()` や `useMemo()` による手動メモ化は不要である。コンパイラが再レンダリングを自動的に最適化する。

### 5.6 エフェクト依存関係の絞り込み

**影響度: LOW（エフェクトの再実行を最小化する）**

オブジェクトではなくプリミティブな依存関係を指定して、エフェクトの再実行を最小化する。

**誤り: user のどのフィールドが変わっても再実行される**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user])
```

**正しい: id が変わったときのみ再実行される**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user.id])
```

**派生 state の場合、エフェクトの外で計算する:**

```tsx
// 誤り: width=767, 766, 765... のたびに実行される
useEffect(() => {
  if (width < 768) {
    enableMobileMode()
  }
}, [width])

// 正しい: boolean の切り替わり時のみ実行される
const isMobile = width < 768
useEffect(() => {
  if (isMobile) {
    enableMobileMode()
  }
}, [isMobile])
```

### 5.7 インタラクションロジックをイベントハンドラに配置する

**影響度: MEDIUM（エフェクトの再実行と副作用の重複を回避する）**

副作用が特定のユーザー操作（送信、クリック、ドラッグ）によってトリガーされる場合、そのイベントハンドラ内で実行する。アクションを state + エフェクトとしてモデル化してはならない。無関係な変更でエフェクトが再実行され、アクションが重複する可能性がある。

**誤り: イベントが state + エフェクトとしてモデル化されている**

```tsx
function Form() {
  const [submitted, setSubmitted] = useState(false)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    if (submitted) {
      post('/api/register')
      showToast('Registered', theme)
    }
  }, [submitted, theme])

  return <button onClick={() => setSubmitted(true)}>Submit</button>
}
```

**正しい: ハンドラ内で実行する**

```tsx
function Form() {
  const theme = useContext(ThemeContext)

  function handleSubmit() {
    post('/api/register')
    showToast('Registered', theme)
  }

  return <button onClick={handleSubmit}>Submit</button>
}
```

参考文献: [https://react.dev/learn/removing-effect-dependencies#should-this-code-move-to-an-event-handler](https://react.dev/learn/removing-effect-dependencies#should-this-code-move-to-an-event-handler)

### 5.8 派生 state のサブスクライブ

**影響度: MEDIUM（再レンダリング頻度を削減）**

連続的な値ではなく、派生されたブール値の state をサブスクライブすることで、再レンダリングの頻度を削減します。

**誤り: ピクセルが変わるたびに再レンダリングされる**

```tsx
function Sidebar() {
  const width = useWindowWidth()  // updates continuously
  const isMobile = width < 768
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

**正しい: ブール値が変化したときのみ再レンダリングされる**

```tsx
function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

### 5.9 関数型 setState 更新を使用する

**影響度: MEDIUM（古いクロージャと不要なコールバック再生成を防止）**

現在の state 値に基づいて state を更新する場合は、state 変数を直接参照するのではなく、setState の関数型更新形式を使用してください。これにより、古いクロージャを防止し、不要な依存関係を排除し、安定したコールバック参照を作成できます。

**誤り: state を依存関係として必要とする**

```tsx
function TodoList() {
  const [items, setItems] = useState(initialItems)

  // Callback must depend on items, recreated on every items change
  const addItems = useCallback((newItems: Item[]) => {
    setItems([...items, ...newItems])
  }, [items])  // ❌ items dependency causes recreations

  // Risk of stale closure if dependency is forgotten
  const removeItem = useCallback((id: string) => {
    setItems(items.filter(item => item.id !== id))
  }, [])  // ❌ Missing items dependency - will use stale items!

  return <ItemsEditor items={items} onAdd={addItems} onRemove={removeItem} />
}
```

最初のコールバックは `items` が変わるたびに再生成され、子コンポーネントが不必要に再レンダリングされる原因になります。2つ目のコールバックには古いクロージャのバグがあり、常に初期の `items` 値を参照してしまいます。

**正しい: 安定したコールバック、古いクロージャなし**

```tsx
function TodoList() {
  const [items, setItems] = useState(initialItems)

  // Stable callback, never recreated
  const addItems = useCallback((newItems: Item[]) => {
    setItems(curr => [...curr, ...newItems])
  }, [])  // ✅ No dependencies needed

  // Always uses latest state, no stale closure risk
  const removeItem = useCallback((id: string) => {
    setItems(curr => curr.filter(item => item.id !== id))
  }, [])  // ✅ Safe and stable

  return <ItemsEditor items={items} onAdd={addItems} onRemove={removeItem} />
}
```

**メリット:**

1. **安定したコールバック参照** - state が変化してもコールバックを再生成する必要がない

2. **古いクロージャなし** - 常に最新の state 値で動作する

3. **依存関係の削減** - 依存配列を簡素化し、メモリリークを削減する

4. **バグの防止** - React のクロージャバグの最も一般的な原因を排除する

**関数型更新を使うべき場合:**

- 現在の state 値に依存する setState すべて

- state が必要な useCallback/useMemo の内部

- state を参照するイベントハンドラー

- state を更新する非同期処理

**直接更新で問題ない場合:**

- 静的な値への state 設定: `setCount(0)`

- props/引数のみからの state 設定: `setName(newName)`

- state が前の値に依存しない場合

**注意:** プロジェクトで [React Compiler](https://react.dev/learn/react-compiler) が有効になっている場合、コンパイラが一部のケースを自動的に最適化できますが、正確性と古いクロージャバグの防止のため、関数型更新が引き続き推奨されます。

### 5.10 state の遅延初期化を使用する

**影響度: MEDIUM（毎回のレンダリングで無駄な計算が発生）**

コストの高い初期値には `useState` に関数を渡してください。関数形式を使用しないと、値が一度しか使われないにもかかわらず、初期化処理が毎回のレンダリングで実行されます。

**誤り: 毎回のレンダリングで実行される**

```tsx
function FilteredList({ items }: { items: Item[] }) {
  // buildSearchIndex() runs on EVERY render, even after initialization
  const [searchIndex, setSearchIndex] = useState(buildSearchIndex(items))
  const [query, setQuery] = useState('')

  // When query changes, buildSearchIndex runs again unnecessarily
  return <SearchResults index={searchIndex} query={query} />
}

function UserProfile() {
  // JSON.parse runs on every render
  const [settings, setSettings] = useState(
    JSON.parse(localStorage.getItem('settings') || '{}')
  )

  return <SettingsForm settings={settings} onChange={setSettings} />
}
```

**正しい: 一度だけ実行される**

```tsx
function FilteredList({ items }: { items: Item[] }) {
  // buildSearchIndex() runs ONLY on initial render
  const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex(items))
  const [query, setQuery] = useState('')

  return <SearchResults index={searchIndex} query={query} />
}

function UserProfile() {
  // JSON.parse runs only on initial render
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('settings')
    return stored ? JSON.parse(stored) : {}
  })

  return <SettingsForm settings={settings} onChange={setSettings} />
}
```

localStorage/sessionStorage からの初期値の計算、データ構造（インデックス、マップ）の構築、DOM からの読み取り、重い変換処理を行う場合に遅延初期化を使用してください。

単純なプリミティブ（`useState(0)`）、直接参照（`useState(props.value)`）、軽量なリテラル（`useState({})`）の場合、関数形式は不要です。

### 5.11 緊急でない更新に Transitions を使用する

**影響度: MEDIUM（UI のレスポンシブ性を維持）**

頻繁で緊急でない state 更新をトランジションとしてマークし、UI のレスポンシブ性を維持します。

**誤り: スクロールのたびに UI をブロックする**

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}
```

**正しい: ノンブロッキング更新**

```tsx
import { startTransition } from 'react'

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => {
      startTransition(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}
```

### 5.12 一時的な値に useRef を使用する

**影響度: MEDIUM（頻繁な更新による不要な再レンダリングを回避）**

値が頻繁に変化し、更新のたびに再レンダリングしたくない場合（例: マウストラッカー、インターバル、一時的なフラグ）、`useState` ではなく `useRef` に格納してください。コンポーネントの state は UI 用に保持し、ref は一時的な DOM 隣接値に使用します。ref の更新は再レンダリングをトリガーしません。

**誤り: 更新のたびにレンダリングされる**

```tsx
function Tracker() {
  const [lastX, setLastX] = useState(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => setLastX(e.clientX)
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: lastX,
        width: 8,
        height: 8,
        background: 'black',
      }}
    />
  )
}
```

**正しい: トラッキングで再レンダリングなし**

```tsx
function Tracker() {
  const lastXRef = useRef(0)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      lastXRef.current = e.clientX
      const node = dotRef.current
      if (node) {
        node.style.transform = `translateX(${e.clientX}px)`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={dotRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 8,
        height: 8,
        background: 'black',
        transform: 'translateX(0px)',
      }}
    />
  )
}
```

---

## 6. レンダリングパフォーマンス

**影響度: MEDIUM**

レンダリングプロセスを最適化することで、ブラウザが行う作業量を削減できます。

### 6.1 SVG 要素ではなく SVG ラッパーをアニメーションする

**影響度: LOW（ハードウェアアクセラレーションを有効化）**

多くのブラウザでは、SVG 要素に対する CSS3 アニメーションのハードウェアアクセラレーションがサポートされていません。SVG を `<div>` で囲み、ラッパーをアニメーションしてください。

**誤り: SVG を直接アニメーション - ハードウェアアクセラレーションなし**

```tsx
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" />
    </svg>
  )
}
```

**正しい: ラッパー div をアニメーション - ハードウェアアクセラレーション有効**

```tsx
function LoadingSpinner() {
  return (
    <div className="animate-spin">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" />
      </svg>
    </div>
  )
}
```

これはすべての CSS トランスフォームとトランジション（`transform`、`opacity`、`translate`、`scale`、`rotate`）に適用されます。ラッパー div により、ブラウザは GPU アクセラレーションを使用して、より滑らかなアニメーションを実現できます。

### 6.2 長いリストに CSS content-visibility を使用する

**影響度: HIGH（初期レンダリングの高速化）**

`content-visibility: auto` を適用して、画面外のレンダリングを遅延させます。

**CSS:**

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

**例:**

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map(msg => (
        <div key={msg.id} className="message-item">
          <Avatar user={msg.author} />
          <div>{msg.content}</div>
        </div>
      ))}
    </div>
  )
}
```

For 1000 messages, browser skips layout/paint for ~990 off-screen items (10× faster initial render).

### 6.3 静的な JSX 要素を巻き上げる

**影響度: LOW（再生成を回避）**

静的な JSX をコンポーネントの外に抽出し、再生成を回避します。

**誤り: レンダリングのたびに要素を再生成する**

```tsx
function LoadingSkeleton() {
  return <div className="animate-pulse h-20 bg-gray-200" />
}

function Container() {
  return (
    <div>
      {loading && <LoadingSkeleton />}
    </div>
  )
}
```

**正しい: 同じ要素を再利用する**

```tsx
const loadingSkeleton = (
  <div className="animate-pulse h-20 bg-gray-200" />
)

function Container() {
  return (
    <div>
      {loading && loadingSkeleton}
    </div>
  )
}
```

これは特に大きな静的 SVG ノードに有効です。レンダリングのたびに再生成するとコストがかかります。

**注意:** プロジェクトで [React Compiler](https://react.dev/learn/react-compiler) が有効になっている場合、コンパイラが自動的に静的な JSX 要素を巻き上げ、コンポーネントの再レンダリングを最適化するため、手動での巻き上げは不要です。

### 6.4 SVG の精度を最適化する

**影響度: LOW（ファイルサイズを削減）**

SVG 座標の精度を下げてファイルサイズを削減します。最適な精度は viewBox のサイズに依存しますが、一般的に精度を下げることを検討すべきです。

**誤り: 過剰な精度**

```svg
<path d="M 10.293847 20.847362 L 30.938472 40.192837" />
```

**正しい: 小数点以下1桁**

```svg
<path d="M 10.3 20.8 L 30.9 40.2" />
```

**SVGO で自動化:**

```bash
npx svgo --precision=1 --multipass icon.svg
```

### 6.5 ちらつきなしでハイドレーションミスマッチを防止する

**影響度: MEDIUM（視覚的なちらつきとハイドレーションエラーを回避）**

クライアント側のストレージ（localStorage、Cookie）に依存するコンテンツをレンダリングする場合、React がハイドレーションする前に DOM を更新する同期スクリプトを注入することで、SSR の破損とハイドレーション後のちらつきの両方を回避します。

**誤り: SSR が壊れる**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  // localStorage is not available on server - throws error
  const theme = localStorage.getItem('theme') || 'light'

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
```

`localStorage` が未定義のため、サーバーサイドレンダリングが失敗します。

**誤り: 視覚的なちらつき**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Runs after hydration - causes visible flash
    const stored = localStorage.getItem('theme')
    if (stored) {
      setTheme(stored)
    }
  }, [])

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
```

コンポーネントはまずデフォルト値（`light`）でレンダリングされ、その後ハイドレーション後に更新されるため、誤ったコンテンツが一瞬表示されます。

**正しい: ちらつきなし、ハイドレーションミスマッチなし**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <div id="theme-wrapper">
        {children}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'light';
                var el = document.getElementById('theme-wrapper');
                if (el) el.className = theme;
              } catch (e) {}
            })();
          `,
        }}
      />
    </>
  )
}
```

インラインスクリプトは要素が表示される前に同期的に実行されるため、DOM にはすでに正しい値が設定されています。ちらつきもハイドレーションミスマッチもありません。

このパターンは、テーマ切り替え、ユーザー設定、認証状態、およびデフォルト値を一瞬表示させずに即座にレンダリングすべきクライアント専用データに特に有効です。

### 6.6 想定されたハイドレーションミスマッチを抑制する

**影響度: LOW-MEDIUM（既知の差異に対するノイジーなハイドレーション警告を回避）**

SSR フレームワーク（例: Next.js）では、サーバーとクライアントで意図的に異なる値（ランダム ID、日付、ロケール/タイムゾーンフォーマット）があります。これらの*想定された*ミスマッチについては、動的テキストを `suppressHydrationWarning` 付きの要素でラップして、ノイジーな警告を防止します。実際のバグを隠すために使用しないでください。多用しないでください。

**誤り: 既知のミスマッチ警告**

```tsx
function Timestamp() {
  return <span>{new Date().toLocaleString()}</span>
}
```

**正しい: 想定されたミスマッチのみ抑制する**

```tsx
function Timestamp() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleString()}
    </span>
  )
}
```

### 6.7 表示/非表示に Activity コンポーネントを使用する

**影響度: MEDIUM（state/DOM を保持）**

React の `<Activity>` を使用して、頻繁に表示/非表示を切り替えるコストの高いコンポーネントの state/DOM を保持します。

**使用方法:**

```tsx
import { Activity } from 'react'

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <ExpensiveMenu />
    </Activity>
  )
}
```

コストの高い再レンダリングと state の喪失を回避します。

### 6.8 明示的な条件付きレンダリングを使用する

**影響度: LOW（0 や NaN のレンダリングを防止）**

条件が `0`、`NaN`、またはレンダリングされる他の falsy 値になりうる場合、条件付きレンダリングには `&&` の代わりに明示的な三項演算子（`? :`）を使用します。

**誤り: count が 0 のとき "0" がレンダリングされる**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count && <span className="badge">{count}</span>}
    </div>
  )
}

// count = 0 の場合: <div>0</div> がレンダリングされる
// count = 5 の場合: <div><span class="badge">5</span></div> がレンダリングされる
```

**正しい: count が 0 のとき何もレンダリングしない**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count > 0 ? <span className="badge">{count}</span> : null}
    </div>
  )
}

// count = 0 の場合: <div></div> がレンダリングされる
// count = 5 の場合: <div><span class="badge">5</span></div> がレンダリングされる
```

### 6.9 手動ローディング state の代わりに useTransition を使用する

**影響度: LOW（再レンダリングを削減しコードの明確性を向上）**

ローディング state には手動の `useState` の代わりに `useTransition` を使用します。組み込みの `isPending` state が提供され、トランジションが自動的に管理されます。

**誤り: 手動のローディング state**

```tsx
function SearchResults() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (value: string) => {
    setIsLoading(true)
    setQuery(value)
    const data = await fetchResults(value)
    setResults(data)
    setIsLoading(false)
  }

  return (
    <>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isLoading && <Spinner />}
      <ResultsList results={results} />
    </>
  )
}
```

**正しい: 組み込みの pending state を持つ useTransition**

```tsx
import { useTransition, useState } from 'react'

function SearchResults() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isPending, startTransition] = useTransition()

  const handleSearch = (value: string) => {
    setQuery(value) // 入力を即座に更新

    startTransition(async () => {
      // 結果を取得して更新
      const data = await fetchResults(value)
      setResults(data)
    })
  }

  return (
    <>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </>
  )
}
```

**メリット:**

- **自動的な pending state**: `setIsLoading(true/false)` を手動で管理する必要がない

- **エラー耐性**: トランジションがエラーをスローしても pending state が正しくリセットされる

- **レスポンシブ性の向上**: 更新中も UI のレスポンシブ性を維持する

- **中断処理**: 新しいトランジションが保留中のトランジションを自動的にキャンセルする

参考文献: [https://react.dev/reference/react/useTransition](https://react.dev/reference/react/useTransition)

---

## 7. JavaScript パフォーマンス

**影響度: LOW-MEDIUM**

ホットパスにおけるマイクロ最適化は、積み重なることで意味のある改善につながる。

### 7.1 レイアウトスラッシングの回避

**影響度: MEDIUM（強制同期レイアウトを防ぎ、パフォーマンスのボトルネックを軽減する）**

スタイルの書き込みとレイアウトの読み取りを交互に行わないこと。スタイル変更の間にレイアウトプロパティ（`offsetWidth`、`getBoundingClientRect()`、`getComputedStyle()` など）を読み取ると、ブラウザは同期リフローを強制的に実行する。

**これは問題なし: ブラウザがスタイル変更をバッチ処理する**

```typescript
function updateElementStyles(element: HTMLElement) {
  // Each line invalidates style, but browser batches the recalculation
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'
}
```

**誤り: 読み取りと書き込みの交互実行がリフローを強制する**

```typescript
function layoutThrashing(element: HTMLElement) {
  element.style.width = '100px'
  const width = element.offsetWidth  // Forces reflow
  element.style.height = '200px'
  const height = element.offsetHeight  // Forces another reflow
}
```

**正しい: 書き込みをバッチ処理してから一度だけ読み取る**

```typescript
function updateElementStyles(element: HTMLElement) {
  // Batch all writes together
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'

  // Read after all writes are done (single reflow)
  const { width, height } = element.getBoundingClientRect()
}
```

**正しい: 読み取りをバッチ処理してから書き込む**

```typescript
function updateElementStyles(element: HTMLElement) {
  element.classList.add('highlighted-box')

  const { width, height } = element.getBoundingClientRect()
}
```

**より良い方法: CSS クラスを使用する**

**React の例:**

```tsx
// Incorrect: interleaving style changes with layout queries
function Box({ isHighlighted }: { isHighlighted: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && isHighlighted) {
      ref.current.style.width = '100px'
      const width = ref.current.offsetWidth // Forces layout
      ref.current.style.height = '200px'
    }
  }, [isHighlighted])

  return <div ref={ref}>Content</div>
}

// Correct: toggle class
function Box({ isHighlighted }: { isHighlighted: boolean }) {
  return (
    <div className={isHighlighted ? 'highlighted-box' : ''}>
      Content
    </div>
  )
}
```

可能な限りインラインスタイルよりも CSS クラスを使用すること。CSS ファイルはブラウザにキャッシュされ、クラスは関心の分離に優れ、メンテナンスも容易である。

レイアウトを強制する操作の詳細については、[この gist](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) と [CSS Triggers](https://csstriggers.com/) を参照。

### 7.2 繰り返しルックアップ用にインデックス Map を構築する

**影響度: LOW-MEDIUM（100万回の操作が2千回に）**

同じキーによる複数の `.find()` 呼び出しには Map を使用すべきである。

**誤り（ルックアップごとに O(n)）:**

```typescript
function processOrders(orders: Order[], users: User[]) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId)
  }))
}
```

**正しい（ルックアップごとに O(1)）:**

```typescript
function processOrders(orders: Order[], users: User[]) {
  const userById = new Map(users.map(u => [u.id, u]))

  return orders.map(order => ({
    ...order,
    user: userById.get(order.userId)
  }))
}
```

Map を一度構築（O(n)）すれば、すべてのルックアップが O(1) になる。

1000件の注文 × 1000人のユーザーの場合: 100万回の操作 → 2千回の操作。

### 7.3 ループ内でプロパティアクセスをキャッシュする

**影響度: LOW-MEDIUM（ルックアップを削減する）**

ホットパスではオブジェクトプロパティのルックアップをキャッシュする。

**誤り: 3回のルックアップ × N回のイテレーション**

```typescript
for (let i = 0; i < arr.length; i++) {
  process(obj.config.settings.value)
}
```

**正しい: ルックアップは合計1回**

```typescript
const value = obj.config.settings.value
const len = arr.length
for (let i = 0; i < len; i++) {
  process(value)
}
```

### 7.4 繰り返しの関数呼び出しをキャッシュする

**影響度: MEDIUM（冗長な計算を回避する）**

レンダリング中に同じ入力で同じ関数が繰り返し呼び出される場合、モジュールレベルの Map を使用して関数の結果をキャッシュする。

**誤り: 冗長な計算**

```typescript
function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // slugify() called 100+ times for same project names
        const slug = slugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

**正しい: キャッシュされた結果**

```typescript
// Module-level cache
const slugifyCache = new Map<string, string>()

function cachedSlugify(text: string): string {
  if (slugifyCache.has(text)) {
    return slugifyCache.get(text)!
  }
  const result = slugify(text)
  slugifyCache.set(text, result)
  return result
}

function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => {
        // Computed only once per unique project name
        const slug = cachedSlugify(project.name)

        return <ProjectCard key={project.id} slug={slug} />
      })}
    </div>
  )
}
```

**単一値関数のよりシンプルなパターン:**

```typescript
let isLoggedInCache: boolean | null = null

function isLoggedIn(): boolean {
  if (isLoggedInCache !== null) {
    return isLoggedInCache
  }

  isLoggedInCache = document.cookie.includes('auth=')
  return isLoggedInCache
}

// Clear cache when auth changes
function onAuthChange() {
  isLoggedInCache = null
}
```

Map（フックではなく）を使用することで、ユーティリティ、イベントハンドラなど、React コンポーネントに限らずどこでも動作する。

参考: [https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast](https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast)

### 7.5 Storage API の呼び出しをキャッシュする

**影響度: LOW-MEDIUM（高コストな I/O を削減する）**

`localStorage`、`sessionStorage`、`document.cookie` は同期的でコストが高い。読み取り結果をメモリにキャッシュする。

**誤り: 呼び出しごとにストレージを読み取る**

```typescript
function getTheme() {
  return localStorage.getItem('theme') ?? 'light'
}
// Called 10 times = 10 storage reads
```

**正しい: Map キャッシュ**

```typescript
const storageCache = new Map<string, string | null>()

function getLocalStorage(key: string) {
  if (!storageCache.has(key)) {
    storageCache.set(key, localStorage.getItem(key))
  }
  return storageCache.get(key)
}

function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value)
  storageCache.set(key, value)  // keep cache in sync
}
```

Map（フックではなく）を使用することで、ユーティリティ、イベントハンドラなど、React コンポーネントに限らずどこでも動作する。

**Cookie のキャッシュ:**

```typescript
let cookieCache: Record<string, string> | null = null

function getCookie(name: string) {
  if (!cookieCache) {
    cookieCache = Object.fromEntries(
      document.cookie.split('; ').map(c => c.split('='))
    )
  }
  return cookieCache[name]
}
```

**重要: 外部からの変更時にキャッシュを無効化する**

```typescript
window.addEventListener('storage', (e) => {
  if (e.key) storageCache.delete(e.key)
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    storageCache.clear()
  }
})
```

ストレージが外部から変更される可能性がある場合（別のタブ、サーバー設定の Cookie など）、キャッシュを無効化する:

### 7.6 複数の配列イテレーションを統合する

**影響度: LOW-MEDIUM（イテレーション回数を削減する）**

複数の `.filter()` や `.map()` 呼び出しは配列を複数回イテレーションする。1つのループに統合する。

**誤り: 3回のイテレーション**

```typescript
const admins = users.filter(u => u.isAdmin)
const testers = users.filter(u => u.isTester)
const inactive = users.filter(u => !u.isActive)
```

**正しい: 1回のイテレーション**

```typescript
const admins: User[] = []
const testers: User[] = []
const inactive: User[] = []

for (const user of users) {
  if (user.isAdmin) admins.push(user)
  if (user.isTester) testers.push(user)
  if (!user.isActive) inactive.push(user)
}
```

### 7.7 配列比較の前に長さチェックを行う

**影響度: MEDIUM-HIGH（長さが異なる場合に高コストな操作を回避する）**

高コストな操作（ソート、深い等価比較、シリアライズ）で配列を比較する場合、まず長さを確認する。長さが異なれば、配列は等しくあり得ない。

実際のアプリケーションでは、この最適化はホットパス（イベントハンドラ、レンダリングループ）で比較が実行される場合に特に有効である。

**誤り: 常に高コストな比較を実行する**

```typescript
function hasChanges(current: string[], original: string[]) {
  // Always sorts and joins, even when lengths differ
  return current.sort().join() !== original.sort().join()
}
```

`current.length` が 5 で `original.length` が 100 の場合でも、2回の O(n log n) ソートが実行される。配列の結合と文字列の比較のオーバーヘッドもある。

**正しい（最初に O(1) の長さチェック）:**

```typescript
function hasChanges(current: string[], original: string[]) {
  // Early return if lengths differ
  if (current.length !== original.length) {
    return true
  }
  // Only sort when lengths match
  const currentSorted = current.toSorted()
  const originalSorted = original.toSorted()
  for (let i = 0; i < currentSorted.length; i++) {
    if (currentSorted[i] !== originalSorted[i]) {
      return true
    }
  }
  return false
}
```

この新しいアプローチがより効率的な理由:

- 長さが異なる場合、ソートと結合のオーバーヘッドを回避する

- 結合された文字列のメモリ消費を回避する（特に大きな配列で重要）

- 元の配列のミューテーションを回避する

- 差異が見つかった時点で早期リターンする

### 7.8 関数からの早期リターン

**影響度: LOW-MEDIUM（不要な計算を回避する）**

結果が確定した時点で早期リターンし、不要な処理をスキップする。

**誤り: 答えが見つかった後もすべてのアイテムを処理する**

```typescript
function validateUsers(users: User[]) {
  let hasError = false
  let errorMessage = ''

  for (const user of users) {
    if (!user.email) {
      hasError = true
      errorMessage = 'Email required'
    }
    if (!user.name) {
      hasError = true
      errorMessage = 'Name required'
    }
    // Continues checking all users even after error found
  }

  return hasError ? { valid: false, error: errorMessage } : { valid: true }
}
```

**正しい: 最初のエラーで即座にリターンする**

```typescript
function validateUsers(users: User[]) {
  for (const user of users) {
    if (!user.email) {
      return { valid: false, error: 'Email required' }
    }
    if (!user.name) {
      return { valid: false, error: 'Name required' }
    }
  }

  return { valid: true }
}
```

### 7.9 RegExp の生成を巻き上げる

**影響度: LOW-MEDIUM（再生成を回避する）**

レンダリング内で RegExp を生成しないこと。モジュールスコープに巻き上げるか、`useMemo()` でメモ化する。

**誤り: レンダリングごとに新しい RegExp を生成する**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**正しい: メモ化または巻き上げ**

```tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Highlighter({ text, query }: Props) {
  const regex = useMemo(
    () => new RegExp(`(${escapeRegex(query)})`, 'gi'),
    [query]
  )
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**警告: グローバル正規表現はミュータブルな状態を持つ**

```typescript
const regex = /foo/g
regex.test('foo')  // true, lastIndex = 3
regex.test('foo')  // false, lastIndex = 0
```

グローバル正規表現（`/g`）はミュータブルな `lastIndex` 状態を持つ:

### 7.10 ソートの代わりにループで Min/Max を求める

**影響度: LOW（O(n log n) ではなく O(n)）**

最小値・最大値の取得には配列を1回走査するだけで十分。ソートは無駄であり、より低速になる。

**誤り（O(n log n) - 最新を見つけるためにソート）:**

```typescript
interface Project {
  id: string
  name: string
  updatedAt: number
}

function getLatestProject(projects: Project[]) {
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
  return sorted[0]
}
```

最大値を見つけるためだけに配列全体をソートしている。

**誤り（O(n log n) - 最古と最新を取得するためにソート）:**

```typescript
function getOldestAndNewest(projects: Project[]) {
  const sorted = [...projects].sort((a, b) => a.updatedAt - b.updatedAt)
  return { oldest: sorted[0], newest: sorted[sorted.length - 1] }
}
```

min/max だけが必要な場合でも不要なソートを行っている。

**正しい（O(n) - 単一ループ）:**

```typescript
function getLatestProject(projects: Project[]) {
  if (projects.length === 0) return null

  let latest = projects[0]

  for (let i = 1; i < projects.length; i++) {
    if (projects[i].updatedAt > latest.updatedAt) {
      latest = projects[i]
    }
  }

  return latest
}

function getOldestAndNewest(projects: Project[]) {
  if (projects.length === 0) return { oldest: null, newest: null }

  let oldest = projects[0]
  let newest = projects[0]

  for (let i = 1; i < projects.length; i++) {
    if (projects[i].updatedAt < oldest.updatedAt) oldest = projects[i]
    if (projects[i].updatedAt > newest.updatedAt) newest = projects[i]
  }

  return { oldest, newest }
}
```

配列を1回走査するだけで、コピーもソートも不要。

**代替案: 小さな配列には Math.min/Math.max**

```typescript
const numbers = [5, 2, 8, 1, 9]
const min = Math.min(...numbers)
const max = Math.max(...numbers)
```

小さな配列では動作するが、スプレッド演算子の制限により、非常に大きな配列ではパフォーマンスが低下するか、エラーがスローされる可能性がある。最大配列長は Chrome 143 で約 124000、Safari 18 で約 638000 だが、正確な数値は異なる場合がある - [フィドル](https://jsfiddle.net/qw1jabsx/4/)を参照。信頼性のためにループアプローチを使用すること。

### 7.11 O(1) ルックアップに Set/Map を使用する

**影響度: LOW-MEDIUM（O(n) から O(1) へ）**

繰り返しのメンバーシップチェックには、配列を Set/Map に変換する。

**誤り（チェックごとに O(n)）:**

```typescript
const allowedIds = ['a', 'b', 'c', ...]
items.filter(item => allowedIds.includes(item.id))
```

**正しい（チェックごとに O(1)）:**

```typescript
const allowedIds = new Set(['a', 'b', 'c', ...])
items.filter(item => allowedIds.has(item.id))
```

### 7.12 イミュータビリティのために sort() の代わりに toSorted() を使用する

**影響度: MEDIUM-HIGH（React state のミューテーションバグを防止）**

`.sort()` は配列をインプレースでミューテートするため、React の state や props でバグを引き起こす可能性がある。ミューテーションなしで新しいソート済み配列を作成するには `.toSorted()` を使用する。

**誤り: 元の配列をミューテートする**

```typescript
function UserList({ users }: { users: User[] }) {
  // users prop の配列をミューテートしてしまう！
  const sorted = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  )
  return <div>{sorted.map(renderUser)}</div>
}
```

**正しい: 新しい配列を作成する**

```typescript
function UserList({ users }: { users: User[] }) {
  // 新しいソート済み配列を作成し、元の配列は変更されない
  const sorted = useMemo(
    () => users.toSorted((a, b) => a.name.localeCompare(b.name)),
    [users]
  )
  return <div>{sorted.map(renderUser)}</div>
}
```

**React で重要な理由:**

1. props/state のミューテーションは React のイミュータビリティモデルを破壊する - React は props と state を読み取り専用として扱うことを期待している

2. 古いクロージャのバグを引き起こす - クロージャ（コールバック、エフェクト）内で配列をミューテートすると、予期しない動作につながる可能性がある

**ブラウザサポート: 古いブラウザ向けのフォールバック**

```typescript
// 古いブラウザ向けのフォールバック
const sorted = [...items].sort((a, b) => a.value - b.value)
```

`.toSorted()` はすべてのモダンブラウザで利用可能（Chrome 110+、Safari 16+、Firefox 115+、Node.js 20+）。古い環境ではスプレッド演算子を使用する。

**その他のイミュータブル配列メソッド:**

- `.toSorted()` - イミュータブルなソート

- `.toReversed()` - イミュータブルなリバース

- `.toSpliced()` - イミュータブルなスプライス

- `.with()` - イミュータブルな要素置換

---

## 8. 高度なパターン

**影響度: LOW**

慎重な実装が必要な特定のケース向けの高度なパターン。

### 8.1 アプリの初期化をマウントごとではなく一度だけ行う

**影響度: LOW-MEDIUM（開発時の重複初期化を回避）**

アプリ全体の初期化処理で、アプリ読み込み時に一度だけ実行すべきものを、コンポーネントの `useEffect([])` 内に配置してはいけない。コンポーネントは再マウントされる可能性があり、エフェクトも再実行される。代わりに、モジュールレベルのガードやエントリモジュールのトップレベル初期化を使用すること。

**誤り: 開発時に2回実行され、再マウント時にも再実行される**

```tsx
function Comp() {
  useEffect(() => {
    loadFromStorage()
    checkAuthToken()
  }, [])

  // ...
}
```

**正しい: アプリ読み込み時に一度だけ実行**

```tsx
let didInit = false

function Comp() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    loadFromStorage()
    checkAuthToken()
  }, [])

  // ...
}
```

参考文献: [https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application)

### 8.2 イベントハンドラを ref に格納する

**影響度: LOW（安定したサブスクリプション）**

コールバックの変更時に再サブスクライブすべきでないエフェクトで使用するコールバックは、ref に格納する。

**誤り: レンダーごとに再サブスクライブされる**

```tsx
function useWindowEvent(event: string, handler: (e) => void) {
  useEffect(() => {
    window.addEventListener(event, handler)
    return () => window.removeEventListener(event, handler)
  }, [event, handler])
}
```

**正しい: 安定したサブスクリプション**

```tsx
import { useEffectEvent } from 'react'

function useWindowEvent(event: string, handler: (e) => void) {
  const onEvent = useEffectEvent(handler)

  useEffect(() => {
    window.addEventListener(event, onEvent)
    return () => window.removeEventListener(event, onEvent)
  }, [event])
}
```

**代替案: 最新の React を使用している場合は `useEffectEvent` を使用する:**

`useEffectEvent` は同じパターンに対してよりクリーンな API を提供する。常にハンドラの最新バージョンを呼び出す安定した関数参照を作成する。

### 8.3 安定したコールバック ref に useEffectEvent を使用する

**影響度: LOW（エフェクトの再実行を防止）**

依存配列に追加せずに、コールバック内で最新の値にアクセスする。古いクロージャを回避しつつ、エフェクトの再実行を防止する。

**誤り: コールバックが変更されるたびにエフェクトが再実行される**

```tsx
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query), 300)
    return () => clearTimeout(timeout)
  }, [query, onSearch])
}
```

**正しい: React の useEffectEvent を使用**

```tsx
import { useEffectEvent } from 'react';

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')
  const onSearchEvent = useEffectEvent(onSearch)

  useEffect(() => {
    const timeout = setTimeout(() => onSearchEvent(query), 300)
    return () => clearTimeout(timeout)
  }, [query])
}
```

---

## 参考文献

1. [https://react.dev](https://react.dev)
2. [https://nextjs.org](https://nextjs.org)
3. [https://swr.vercel.app](https://swr.vercel.app)
4. [https://github.com/shuding/better-all](https://github.com/shuding/better-all)
5. [https://github.com/isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache)
6. [https://vercel.com/blog/how-we-optimized-package-imports-in-next-js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
7. [https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast](https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast)
