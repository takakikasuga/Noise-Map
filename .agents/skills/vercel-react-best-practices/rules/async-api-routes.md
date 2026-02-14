---
title: API ルートでのウォーターフォールチェーンを防止する
impact: CRITICAL
impactDescription: 2〜10倍の改善
tags: api-routes, server-actions, waterfalls, parallelization
---

## API ルートでのウォーターフォールチェーンを防止する

API ルートと Server Actions では、まだ await しなくても独立した処理を即座に開始してください。

**誤り（config が auth を待ち、data が両方を待つ）：**

```typescript
export async function GET(request: Request) {
  const session = await auth()
  const config = await fetchConfig()
  const data = await fetchData(session.user.id)
  return Response.json({ data, config })
}
```

**正しい（auth と config を即座に開始する）：**

```typescript
export async function GET(request: Request) {
  const sessionPromise = auth()
  const configPromise = fetchConfig()
  const session = await sessionPromise
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id)
  ])
  return Response.json({ data, config })
}
```

より複雑な依存チェーンを持つ操作の場合は、`better-all` を使用して自動的に並列性を最大化してください（依存関係ベースの並列化を参照）。
