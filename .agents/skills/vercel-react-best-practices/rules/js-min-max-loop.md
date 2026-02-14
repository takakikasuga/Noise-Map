---
title: ソートの代わりにループで Min/Max を求める
impact: LOW
impactDescription: O(n log n) の代わりに O(n)
tags: javascript, arrays, performance, sorting, algorithms
---

## ソートの代わりにループで Min/Max を求める

最小または最大の要素を見つけるには、配列を一度通過するだけで十分です。ソートは無駄で低速です。

**誤り（O(n log n) - 最新を見つけるためにソート）：**

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

最大値を見つけるためだけに配列全体をソートしています。

**誤り（O(n log n) - 最古と最新のためにソート）：**

```typescript
function getOldestAndNewest(projects: Project[]) {
  const sorted = [...projects].sort((a, b) => a.updatedAt - b.updatedAt)
  return { oldest: sorted[0], newest: sorted[sorted.length - 1] }
}
```

min/max だけが必要な場合でも不必要にソートしています。

**正しい（O(n) - 単一ループ）：**

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

配列を一度通過するだけで、コピーもソートも不要です。

**代替案（小さな配列には Math.min/Math.max）：**

```typescript
const numbers = [5, 2, 8, 1, 9]
const min = Math.min(...numbers)
const max = Math.max(...numbers)
```

これは小さな配列では動作しますが、スプレッド演算子の制限により、非常に大きな配列では遅くなるかエラーをスローする可能性があります。最大配列長は Chrome 143 で約124,000、Safari 18 で約638,000です。正確な数値は異なる場合があります - [the fiddle](https://jsfiddle.net/qw1jabsx/4/) を参照してください。信頼性のためにはループアプローチを使用してください。
