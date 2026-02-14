---
title: ノンブロッキング処理に after() を使用する
impact: MEDIUM
impactDescription: レスポンスタイムの高速化
tags: server, async, logging, analytics, side-effects
---

## ノンブロッキング処理に after() を使用する

レスポンス送信後に実行すべき処理をスケジュールするために、Next.js の `after()` を使用します。これにより、ロギング、アナリティクス、その他の副作用がレスポンスをブロックすることを防ぎます。

**誤り（レスポンスをブロックする）：**

```tsx
import { logUserAction } from '@/app/utils'

export async function POST(request: Request) {
  // ミューテーションを実行
  await updateDatabase(request)

  // ロギングがレスポンスをブロックする
  const userAgent = request.headers.get('user-agent') || 'unknown'
  await logUserAction({ userAgent })

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**正しい（ノンブロッキング）：**

```tsx
import { after } from 'next/server'
import { headers, cookies } from 'next/headers'
import { logUserAction } from '@/app/utils'

export async function POST(request: Request) {
  // ミューテーションを実行
  await updateDatabase(request)

  // レスポンス送信後にログを記録
  after(async () => {
    const userAgent = (await headers()).get('user-agent') || 'unknown'
    const sessionCookie = (await cookies()).get('session-id')?.value || 'anonymous'

    logUserAction({ sessionCookie, userAgent })
  })

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

レスポンスはすぐに送信され、ロギングはバックグラウンドで実行されます。

**一般的なユースケース：**

- アナリティクストラッキング
- 監査ログ
- 通知の送信
- キャッシュの無効化
- クリーンアップタスク

**重要な注意事項：**

- `after()` はレスポンスが失敗またはリダイレクトした場合でも実行される
- Server Actions、Route Handlers、Server Components で動作する

参考：[https://nextjs.org/docs/app/api-reference/functions/after](https://nextjs.org/docs/app/api-reference/functions/after)
