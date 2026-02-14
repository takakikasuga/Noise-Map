---
title: クロスリクエスト LRU キャッシュ
impact: HIGH
impactDescription: リクエスト間でキャッシュ
tags: server, cache, lru, cross-request
---

## クロスリクエスト LRU キャッシュ

`React.cache()` は1つのリクエスト内でのみ動作します。連続するリクエスト間で共有されるデータ（ユーザーがボタン A をクリックしてからボタン B をクリックする場合）には、LRU キャッシュを使用してください。

**実装：**

```typescript
import { LRUCache } from 'lru-cache'

const cache = new LRUCache<string, any>({
  max: 1000,
  ttl: 5 * 60 * 1000  // 5分
})

export async function getUser(id: string) {
  const cached = cache.get(id)
  if (cached) return cached

  const user = await db.user.findUnique({ where: { id } })
  cache.set(id, user)
  return user
}

// リクエスト1：DBクエリ、結果がキャッシュされる
// リクエスト2：キャッシュヒット、DBクエリなし
```

連続するユーザーアクションが数秒以内に同じデータを必要とする複数のエンドポイントにアクセスする場合に使用してください。

**Vercel の [Fluid Compute](https://vercel.com/docs/fluid-compute) を使用する場合：** 複数の同時リクエストが同じ関数インスタンスとキャッシュを共有できるため、LRU キャッシュは特に効果的です。これにより、Redis のような外部ストレージを必要とせずにリクエスト間でキャッシュが保持されます。

**従来のサーバーレスの場合：** 各呼び出しは分離して実行されるため、クロスプロセスキャッシュには Redis を検討してください。

参考：[https://github.com/isaacs/node-lru-cache](https://github.com/isaacs/node-lru-cache)
