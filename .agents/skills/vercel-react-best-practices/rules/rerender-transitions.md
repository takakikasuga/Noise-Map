---
title: 緊急でない更新にトランジションを使用する
impact: MEDIUM
impactDescription: UI のレスポンシブ性を維持
tags: rerender, transitions, startTransition, performance
---

## 緊急でない更新にトランジションを使用する

UI のレスポンシブ性を維持するために、頻繁で緊急でない state の更新をトランジションとしてマークします。

**誤り（スクロールごとに UI をブロックする）：**

```tsx
function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}
```

**正しい（ノンブロッキングな更新）：**

```tsx
import { startTransition } from 'react'

function ScrollTracker() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => {
      startTransition(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}
```
