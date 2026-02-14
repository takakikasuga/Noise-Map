---
title: 繰り返しの検索用にインデックス Map を構築する
impact: LOW-MEDIUM
impactDescription: 100万回の操作が2,000回に
tags: javascript, map, indexing, optimization, performance
---

## 繰り返しの検索用にインデックス Map を構築する

同じキーによる複数の `.find()` 呼び出しは Map を使用すべきです。

**誤り（検索ごとに O(n)）：**

```typescript
function processOrders(orders: Order[], users: User[]) {
  return orders.map(order => ({
    ...order,
    user: users.find(u => u.id === order.userId)
  }))
}
```

**正しい（検索ごとに O(1)）：**

```typescript
function processOrders(orders: Order[], users: User[]) {
  const userById = new Map(users.map(u => [u.id, u]))

  return orders.map(order => ({
    ...order,
    user: userById.get(order.userId)
  }))
}
```

Map を一度構築（O(n)）すれば、すべての検索は O(1) になります。
1000件の注文 x 1000人のユーザーの場合：100万回の操作 → 2,000回の操作。
