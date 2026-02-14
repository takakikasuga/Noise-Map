---
title: await を必要になるまで遅延させる
impact: HIGH
impactDescription: 未使用のコードパスのブロックを回避
tags: async, await, conditional, optimization
---

## await を必要になるまで遅延させる

`await` 操作を実際に使用する分岐に移動して、不要なコードパスのブロックを回避します。

**誤り（両方の分岐をブロックする）：**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    // すぐに返すが、userData を待ってしまっている
    return { skipped: true }
  }

  // この分岐だけが userData を使用する
  return processUserData(userData)
}
```

**正しい（必要な場合のみブロックする）：**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // 待機せずにすぐに返す
    return { skipped: true }
  }

  // 必要な場合のみフェッチする
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

**別の例（早期リターンの最適化）：**

```typescript
// 誤り：常に権限をフェッチする
async function updateResource(resourceId: string, userId: string) {
  const permissions = await fetchPermissions(userId)
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: 'Not found' }
  }

  if (!permissions.canEdit) {
    return { error: 'Forbidden' }
  }

  return await updateResourceData(resource, permissions)
}

// 正しい：必要な場合のみフェッチする
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: 'Not found' }
  }

  const permissions = await fetchPermissions(userId)

  if (!permissions.canEdit) {
    return { error: 'Forbidden' }
  }

  return await updateResourceData(resource, permissions)
}
```

この最適化は、スキップされる分岐が頻繁に実行される場合や、遅延される操作がコストの高い場合に特に有効です。
