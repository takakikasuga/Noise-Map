---
title: エフェクトの依存関係を絞り込む
impact: LOW
impactDescription: エフェクトの再実行を最小化
tags: rerender, useEffect, dependencies, optimization
---

## エフェクトの依存関係を絞り込む

エフェクトの再実行を最小化するために、オブジェクトではなくプリミティブな依存関係を指定します。

**誤り（user のどのフィールドが変更されても再実行される）：**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user])
```

**正しい（id が変更された場合のみ再実行される）：**

```tsx
useEffect(() => {
  console.log(user.id)
}, [user.id])
```

**派生 state の場合、エフェクトの外で計算する：**

```tsx
// 誤り：width=767, 766, 765... で実行される
useEffect(() => {
  if (width < 768) {
    enableMobileMode()
  }
}, [width])

// 正しい：ブール値の遷移時のみ実行される
const isMobile = width < 768
useEffect(() => {
  if (isMobile) {
    enableMobileMode()
  }
}, [isMobile])
```
