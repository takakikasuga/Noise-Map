---
title: 派生 state をサブスクライブする
impact: MEDIUM
impactDescription: 再レンダリング頻度を削減
tags: rerender, derived-state, media-query, optimization
---

## 派生 state をサブスクライブする

再レンダリング頻度を削減するために、連続的な値ではなく派生されたブール state をサブスクライブします。

**誤り（ピクセルの変更ごとに再レンダリングされる）：**

```tsx
function Sidebar() {
  const width = useWindowWidth()  // 連続的に更新される
  const isMobile = width < 768
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```

**正しい（ブール値が変更された場合のみ再レンダリングされる）：**

```tsx
function Sidebar() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  return <nav className={isMobile ? 'mobile' : 'desktop'} />
}
```
