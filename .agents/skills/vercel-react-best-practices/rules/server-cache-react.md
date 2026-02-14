---
title: React.cache() によるリクエスト単位の重複排除
impact: MEDIUM
impactDescription: リクエスト内で重複排除
tags: server, cache, react-cache, deduplication
---

## React.cache() によるリクエスト単位の重複排除

サーバーサイドのリクエスト重複排除に `React.cache()` を使用します。認証とデータベースクエリが最も恩恵を受けます。

**使い方：**

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

単一リクエスト内では、`getCurrentUser()` への複数の呼び出しはクエリを一度だけ実行します。

**引数にインラインオブジェクトを避ける：**

`React.cache()` はキャッシュヒットを判定するために浅い等価性（`Object.is`）を使用します。インラインオブジェクトは呼び出しごとに新しい参照を作成し、キャッシュヒットを妨げます。

**誤り（常にキャッシュミス）：**

```typescript
const getUser = cache(async (params: { uid: number }) => {
  return await db.user.findUnique({ where: { id: params.uid } })
})

// 呼び出しごとに新しいオブジェクトが作成され、キャッシュにヒットしない
getUser({ uid: 1 })
getUser({ uid: 1 })  // キャッシュミス、クエリを再実行
```

**正しい（キャッシュヒット）：**

```typescript
const getUser = cache(async (uid: number) => {
  return await db.user.findUnique({ where: { id: uid } })
})

// プリミティブ引数は値の等価性を使用
getUser(1)
getUser(1)  // キャッシュヒット、キャッシュされた結果を返す
```

オブジェクトを渡す必要がある場合は、同じ参照を渡してください：

```typescript
const params = { uid: 1 }
getUser(params)  // クエリ実行
getUser(params)  // キャッシュヒット（同じ参照）
```

**Next.js 固有の注意事項：**

Next.js では、`fetch` API がリクエストメモ化で自動的に拡張されています。同じ URL とオプションを持つリクエストは、単一リクエスト内で自動的に重複排除されるため、`fetch` 呼び出しに `React.cache()` は不要です。ただし、`React.cache()` は他の非同期タスクには依然として不可欠です：

- データベースクエリ（Prisma、Drizzle など）
- 重い計算
- 認証チェック
- ファイルシステム操作
- fetch 以外のすべての非同期処理

コンポーネントツリー全体でこれらの操作を重複排除するために `React.cache()` を使用してください。

参考：[React.cache ドキュメント](https://react.dev/reference/react/cache)
