---
title: 想定されるハイドレーションミスマッチを抑制する
impact: LOW-MEDIUM
impactDescription: 既知の差異に対するノイジーなハイドレーション警告を回避
tags: rendering, hydration, ssr, nextjs
---

## 想定されるハイドレーションミスマッチを抑制する

SSR フレームワーク（例：Next.js）では、サーバーとクライアントで意図的に異なる値（ランダム ID、日付、ロケール/タイムゾーンのフォーマット）があります。これらの*想定される*ミスマッチに対しては、動的テキストを `suppressHydrationWarning` 付きの要素でラップして、ノイジーな警告を防止してください。実際のバグを隠すために使用しないでください。乱用しないでください。

**誤り（既知のミスマッチ警告）：**

```tsx
function Timestamp() {
  return <span>{new Date().toLocaleString()}</span>
}
```

**正しい（想定されるミスマッチのみ抑制）：**

```tsx
function Timestamp() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleString()}
    </span>
  )
}
```
