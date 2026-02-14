---
title: SVG 要素ではなく SVG ラッパーをアニメーションする
impact: LOW
impactDescription: ハードウェアアクセラレーションを有効にする
tags: rendering, svg, css, animation, performance
---

## SVG 要素ではなく SVG ラッパーをアニメーションする

多くのブラウザは SVG 要素に対する CSS3 アニメーションのハードウェアアクセラレーションを持っていません。SVG を `<div>` でラップし、ラッパーをアニメーションしてください。

**誤り（SVG を直接アニメーション - ハードウェアアクセラレーションなし）：**

```tsx
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" />
    </svg>
  )
}
```

**正しい（ラッパー div をアニメーション - ハードウェアアクセラレーション対応）：**

```tsx
function LoadingSpinner() {
  return (
    <div className="animate-spin">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" />
      </svg>
    </div>
  )
}
```

これはすべての CSS トランスフォームとトランジション（`transform`、`opacity`、`translate`、`scale`、`rotate`）に適用されます。ラッパー div によりブラウザがよりスムーズなアニメーションのために GPU アクセラレーションを使用できます。
