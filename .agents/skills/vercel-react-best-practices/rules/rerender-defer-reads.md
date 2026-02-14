---
title: state の読み取りを使用箇所まで遅延させる
impact: MEDIUM
impactDescription: 不要なサブスクリプションを回避
tags: rerender, searchParams, localStorage, optimization
---

## state の読み取りを使用箇所まで遅延させる

コールバック内でのみ読み取る動的な state（searchParams、localStorage）をサブスクライブしないでください。

**誤り（すべての searchParams の変更にサブスクライブする）：**

```tsx
function ShareButton({ chatId }: { chatId: string }) {
  const searchParams = useSearchParams()

  const handleShare = () => {
    const ref = searchParams.get('ref')
    shareChat(chatId, { ref })
  }

  return <button onClick={handleShare}>Share</button>
}
```

**正しい（オンデマンドで読み取り、サブスクリプションなし）：**

```tsx
function ShareButton({ chatId }: { chatId: string }) {
  const handleShare = () => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    shareChat(chatId, { ref })
  }

  return <button onClick={handleShare}>Share</button>
}
```
