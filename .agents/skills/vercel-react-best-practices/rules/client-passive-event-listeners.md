---
title: スクロールパフォーマンスのためのパッシブイベントリスナー
impact: MEDIUM
impactDescription: イベントリスナーによるスクロール遅延を排除
tags: client, event-listeners, scrolling, performance, touch, wheel
---

## スクロールパフォーマンスのためのパッシブイベントリスナー

タッチおよびホイールのイベントリスナーに `{ passive: true }` を追加して、即座のスクロールを有効にします。ブラウザは通常、`preventDefault()` が呼び出されるかどうかを確認するためにリスナーの完了を待ち、スクロールの遅延を引き起こします。

**誤り：**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  const handleWheel = (e: WheelEvent) => console.log(e.deltaY)

  document.addEventListener('touchstart', handleTouch)
  document.addEventListener('wheel', handleWheel)

  return () => {
    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('wheel', handleWheel)
  }
}, [])
```

**正しい：**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  const handleWheel = (e: WheelEvent) => console.log(e.deltaY)

  document.addEventListener('touchstart', handleTouch, { passive: true })
  document.addEventListener('wheel', handleWheel, { passive: true })

  return () => {
    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('wheel', handleWheel)
  }
}, [])
```

**パッシブを使用する場合：** トラッキング/アナリティクス、ロギング、`preventDefault()` を呼び出さないリスナー。

**パッシブを使用しない場合：** カスタムスワイプジェスチャー、カスタムズームコントロール、または `preventDefault()` が必要なリスナーを実装する場合。
