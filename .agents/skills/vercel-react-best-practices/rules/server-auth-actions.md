---
title: Server Actions を API ルートと同様に認証する
impact: CRITICAL
impactDescription: サーバーミューテーションへの不正アクセスを防止
tags: server, server-actions, authentication, security, authorization
---

## Server Actions を API ルートと同様に認証する

**影響：CRITICAL（サーバーミューテーションへの不正アクセスを防止）**

Server Actions（`"use server"` を持つ関数）は、API ルートと同様にパブリックエンドポイントとして公開されます。各 Server Action の**内部で**常に認証と認可を検証してください。ミドルウェア、レイアウトガード、ページレベルのチェックだけに頼らないでください。Server Actions は直接呼び出すことができます。

Next.js のドキュメントでは明確に次のように述べています：「Server Actions を公開 API エンドポイントと同じセキュリティ上の考慮事項で扱い、ユーザーがミューテーションを実行する権限があるかどうかを検証してください。」

**誤り（認証チェックなし）：**

```typescript
'use server'

export async function deleteUser(userId: string) {
  // 誰でもこれを呼び出せる！認証チェックなし
  await db.user.delete({ where: { id: userId } })
  return { success: true }
}
```

**正しい（アクション内部で認証）：**

```typescript
'use server'

import { verifySession } from '@/lib/auth'
import { unauthorized } from '@/lib/errors'

export async function deleteUser(userId: string) {
  // 常にアクション内部で認証をチェック
  const session = await verifySession()

  if (!session) {
    throw unauthorized('Must be logged in')
  }

  // 認可もチェック
  if (session.user.role !== 'admin' && session.user.id !== userId) {
    throw unauthorized('Cannot delete other users')
  }

  await db.user.delete({ where: { id: userId } })
  return { success: true }
}
```

**入力バリデーション付き：**

```typescript
'use server'

import { verifySession } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email()
})

export async function updateProfile(data: unknown) {
  // まず入力をバリデーション
  const validated = updateProfileSchema.parse(data)

  // 次に認証
  const session = await verifySession()
  if (!session) {
    throw new Error('Unauthorized')
  }

  // 次に認可
  if (session.user.id !== validated.userId) {
    throw new Error('Can only update own profile')
  }

  // 最後にミューテーションを実行
  await db.user.update({
    where: { id: validated.userId },
    data: {
      name: validated.name,
      email: validated.email
    }
  })

  return { success: true }
}
```

参考：[https://nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)
