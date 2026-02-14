---
title: RegExp の生成を巻き上げる
impact: LOW-MEDIUM
impactDescription: 再生成を回避
tags: javascript, regexp, optimization, memoization
---

## RegExp の生成を巻き上げる

レンダリング内で RegExp を作成しないでください。モジュールスコープに巻き上げるか、`useMemo()` でメモ化してください。

**誤り（レンダーごとに新しい RegExp）：**

```tsx
function Highlighter({ text, query }: Props) {
  const regex = new RegExp(`(${query})`, 'gi')
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**正しい（メモ化または巻き上げ）：**

```tsx
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Highlighter({ text, query }: Props) {
  const regex = useMemo(
    () => new RegExp(`(${escapeRegex(query)})`, 'gi'),
    [query]
  )
  const parts = text.split(regex)
  return <>{parts.map((part, i) => ...)}</>
}
```

**警告（グローバル正規表現にはミュータブルな状態がある）：**

グローバル正規表現（`/g`）にはミュータブルな `lastIndex` の状態があります：

```typescript
const regex = /foo/g
regex.test('foo')  // true, lastIndex = 3
regex.test('foo')  // false, lastIndex = 0
```
