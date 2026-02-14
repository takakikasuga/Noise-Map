---
title: 重いコンポーネントの動的インポート
impact: CRITICAL
impactDescription: TTI と LCP に直接影響
tags: bundle, dynamic-import, code-splitting, next-dynamic
---

## 重いコンポーネントの動的インポート

初期レンダリングに不要な大きなコンポーネントを遅延ロードするには、`next/dynamic` を使用します。

**誤り（Monaco がメインチャンクと一緒にバンドルされる 約300KB）：**

```tsx
import { MonacoEditor } from './monaco-editor'

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```

**正しい（Monaco がオンデマンドでロードされる）：**

```tsx
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then(m => m.MonacoEditor),
  { ssr: false }
)

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />
}
```
