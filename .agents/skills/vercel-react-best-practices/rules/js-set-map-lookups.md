---
title: O(1) ルックアップに Set/Map を使用する
impact: LOW-MEDIUM
impactDescription: O(n) が O(1) に
tags: javascript, set, map, data-structures, performance
---

## O(1) ルックアップに Set/Map を使用する

繰り返しのメンバーシップチェックのために配列を Set/Map に変換します。

**誤り（チェックごとに O(n)）：**

```typescript
const allowedIds = ['a', 'b', 'c', ...]
items.filter(item => allowedIds.includes(item.id))
```

**正しい（チェックごとに O(1)）：**

```typescript
const allowedIds = new Set(['a', 'b', 'c', ...])
items.filter(item => allowedIds.has(item.id))
```
