---
title: RSC バウンダリでのシリアライゼーションを最小化する
impact: HIGH
impactDescription: データ転送サイズを削減
tags: server, rsc, serialization, props
---

## RSC バウンダリでのシリアライゼーションを最小化する

React のサーバー/クライアントバウンダリは、すべてのオブジェクトプロパティを文字列にシリアライズし、HTML レスポンスおよび後続の RSC リクエストに埋め込みます。このシリアライズされたデータはページの重さとロード時間に直接影響するため、**サイズは非常に重要です**。クライアントが実際に使用するフィールドのみを渡してください。

**誤り（50個のフィールドすべてをシリアライズする）：**

```tsx
async function Page() {
  const user = await fetchUser()  // 50個のフィールド
  return <Profile user={user} />
}

'use client'
function Profile({ user }: { user: User }) {
  return <div>{user.name}</div>  // 1つのフィールドのみ使用
}
```

**正しい（1つのフィールドのみシリアライズする）：**

```tsx
async function Page() {
  const user = await fetchUser()
  return <Profile name={user.name} />
}

'use client'
function Profile({ name }: { name: string }) {
  return <div>{name}</div>
}
```
