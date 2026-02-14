---
title: 戦略的な Suspense バウンダリ
impact: HIGH
impactDescription: 初期描画の高速化
tags: async, suspense, streaming, layout-shift
---

## 戦略的な Suspense バウンダリ

非同期コンポーネントで JSX を返す前にデータを await するのではなく、Suspense バウンダリを使用してデータのロード中にラッパー UI をより早く表示します。

**誤り（ラッパーがデータフェッチにブロックされる）：**

```tsx
async function Page() {
  const data = await fetchData() // ページ全体をブロック

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

中央のセクションだけがデータを必要としているのに、レイアウト全体がデータを待っています。

**正しい（ラッパーがすぐに表示され、データがストリーミングされる）：**

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
  const data = await fetchData() // このコンポーネントだけをブロック
  return <div>{data.content}</div>
}
```

Sidebar、Header、Footer はすぐにレンダリングされます。DataDisplay だけがデータを待ちます。

**代替案（コンポーネント間で Promise を共有）：**

```tsx
function Page() {
  // フェッチをすぐに開始するが、await はしない
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
  const data = use(dataPromise) // Promise をアンラップ
  return <div>{data.content}</div>
}

function DataSummary({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // 同じ Promise を再利用
  return <div>{data.summary}</div>
}
```

両方のコンポーネントが同じ Promise を共有するため、フェッチは1回だけ実行されます。レイアウトはすぐにレンダリングされ、両方のコンポーネントは一緒に待機します。

**このパターンを使用すべきでない場合：**

- レイアウトの決定に必要なクリティカルなデータ（配置に影響する）
- ファーストビュー上のSEOクリティカルなコンテンツ
- Suspense のオーバーヘッドが見合わない小さく高速なクエリ
- レイアウトシフトを避けたい場合（ローディング→コンテンツのジャンプ）

**トレードオフ：** 初期描画の高速化と潜在的なレイアウトシフト。UX の優先度に基づいて選択してください。
