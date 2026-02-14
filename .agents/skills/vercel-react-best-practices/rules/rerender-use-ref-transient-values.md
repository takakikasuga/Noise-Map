---
title: 一時的な値に useRef を使用する
impact: MEDIUM
impactDescription: 頻繁な更新での不要な再レンダリングを回避
tags: rerender, useref, state, performance
---

## 一時的な値に useRef を使用する

値が頻繁に変更され、更新ごとに再レンダリングしたくない場合（例：マウストラッカー、インターバル、一時的なフラグ）、`useState` の代わりに `useRef` に格納してください。コンポーネントの state は UI 用に保持し、一時的な DOM 関連の値には ref を使用してください。ref の更新は再レンダリングをトリガーしません。

**誤り（更新ごとにレンダリングする）：**

```tsx
function Tracker() {
  const [lastX, setLastX] = useState(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => setLastX(e.clientX)
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: lastX,
        width: 8,
        height: 8,
        background: 'black',
      }}
    />
  )
}
```

**正しい（トラッキングで再レンダリングなし）：**

```tsx
function Tracker() {
  const lastXRef = useRef(0)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      lastXRef.current = e.clientX
      const node = dotRef.current
      if (node) {
        node.style.transform = `translateX(${e.clientX}px)`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div
      ref={dotRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 8,
        height: 8,
        background: 'black',
        transform: 'translateX(0px)',
      }}
    />
  )
}
```
