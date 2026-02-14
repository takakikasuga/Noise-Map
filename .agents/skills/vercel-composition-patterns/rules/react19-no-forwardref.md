---
title: React 19 API の変更点
impact: MEDIUM
impactDescription: よりクリーンなコンポーネント定義と context の使用
tags: react19, refs, context, hooks
---

## React 19 API の変更点

> **注意: React 19 以降のみ。** React 18 以前を使用している場合はスキップしてください。

React 19 では、`ref` は通常の prop になり（`forwardRef` ラッパーが不要に）、`use()` が `useContext()` に代わります。

**悪い例（React 19 での forwardRef）:**

```tsx
const ComposerInput = forwardRef<TextInput, Props>((props, ref) => {
  return <TextInput ref={ref} {...props} />
})
```

**良い例（ref を通常の prop として使う）:**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

**悪い例（React 19 での useContext）:**

```tsx
const value = useContext(MyContext)
```

**良い例（useContext の代わりに use を使う）:**

```tsx
const value = use(MyContext)
```

`use()` は `useContext()` と異なり、条件付きで呼び出すこともできます。
