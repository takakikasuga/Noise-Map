---
title: プリミティブな結果型を持つシンプルな式を useMemo でラップしない
impact: LOW-MEDIUM
impactDescription: レンダーごとに無駄な計算
tags: rerender, useMemo, optimization
---

## プリミティブな結果型を持つシンプルな式を useMemo でラップしない

式がシンプル（少数の論理演算子や算術演算子）で、プリミティブな結果型（boolean、number、string）を持つ場合、`useMemo` でラップしないでください。
`useMemo` の呼び出しとフック依存関係の比較は、式自体よりも多くのリソースを消費する可能性があります。

**誤り：**

```tsx
function Header({ user, notifications }: Props) {
  const isLoading = useMemo(() => {
    return user.isLoading || notifications.isLoading
  }, [user.isLoading, notifications.isLoading])

  if (isLoading) return <Skeleton />
  // マークアップを返す
}
```

**正しい：**

```tsx
function Header({ user, notifications }: Props) {
  const isLoading = user.isLoading || notifications.isLoading

  if (isLoading) return <Skeleton />
  // マークアップを返す
}
```
