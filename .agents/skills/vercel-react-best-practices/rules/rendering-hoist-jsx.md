---
title: 静的な JSX 要素を巻き上げる
impact: LOW
impactDescription: 再生成を回避
tags: rendering, jsx, static, optimization
---

## 静的な JSX 要素を巻き上げる

再生成を回避するために、静的な JSX をコンポーネントの外に抽出します。

**誤り（レンダーごとに要素を再生成する）：**

```tsx
function LoadingSkeleton() {
  return <div className="animate-pulse h-20 bg-gray-200" />
}

function Container() {
  return (
    <div>
      {loading && <LoadingSkeleton />}
    </div>
  )
}
```

**正しい（同じ要素を再利用する）：**

```tsx
const loadingSkeleton = (
  <div className="animate-pulse h-20 bg-gray-200" />
)

function Container() {
  return (
    <div>
      {loading && loadingSkeleton}
    </div>
  )
}
```

これは大きな静的 SVG ノードに特に有効で、レンダーごとに再生成するとコストが高くなる可能性があります。

**注意：** プロジェクトで [React Compiler](https://react.dev/learn/react-compiler) が有効になっている場合、コンパイラは自動的に静的な JSX 要素を巻き上げ、コンポーネントの再レンダリングを最適化するため、手動での巻き上げは不要です。
