---
title: 独立した操作に Promise.all() を使用する
impact: CRITICAL
impactDescription: 2〜10倍の改善
tags: async, parallelization, promises, waterfalls
---

## 独立した操作に Promise.all() を使用する

非同期操作に相互依存関係がない場合、`Promise.all()` を使用して並行実行します。

**誤り（逐次実行、3回のラウンドトリップ）：**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**正しい（並列実行、1回のラウンドトリップ）：**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```
