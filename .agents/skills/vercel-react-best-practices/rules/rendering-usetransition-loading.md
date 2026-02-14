---
title: 手動のローディング state より useTransition を使用する
impact: LOW
impactDescription: 再レンダリングを削減しコードの明確さを向上
tags: rendering, transitions, useTransition, loading, state
---

## 手動のローディング state より useTransition を使用する

ローディング state には手動の `useState` の代わりに `useTransition` を使用してください。組み込みの `isPending` state を提供し、自動的にトランジションを管理します。

**誤り（手動のローディング state）：**

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

**正しい（組み込みの pending state を持つ useTransition）：**

```tsx
import { useTransition, useState } from 'react'

function SearchResults() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isPending, startTransition] = useTransition()

  const handleSearch = (value: string) => {
    setQuery(value) // 入力をすぐに更新

    startTransition(async () => {
      // 結果をフェッチして更新
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

**メリット：**

- **自動的な pending state**：`setIsLoading(true/false)` を手動で管理する必要がない
- **エラーへの耐性**：トランジションがスローしても pending state が正しくリセットされる
- **より良いレスポンシブ性**：更新中も UI のレスポンシブ性を維持する
- **中断ハンドリング**：新しいトランジションが自動的に保留中のトランジションをキャンセルする

参考：[useTransition](https://react.dev/reference/react/useTransition)
