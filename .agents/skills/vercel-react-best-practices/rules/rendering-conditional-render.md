---
title: 明示的な条件付きレンダリングを使用する
impact: LOW
impactDescription: 0 や NaN のレンダリングを防止
tags: rendering, conditional, jsx, falsy-values
---

## 明示的な条件付きレンダリングを使用する

条件が `0`、`NaN`、またはレンダリングされるその他の falsy 値になる可能性がある場合、条件付きレンダリングには `&&` の代わりに明示的な三項演算子（`? :`）を使用してください。

**誤り（count が 0 の場合に "0" をレンダリングする）：**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count && <span className="badge">{count}</span>}
    </div>
  )
}

// count = 0 の場合、レンダリング結果: <div>0</div>
// count = 5 の場合、レンダリング結果: <div><span class="badge">5</span></div>
```

**正しい（count が 0 の場合は何もレンダリングしない）：**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count > 0 ? <span className="badge">{count}</span> : null}
    </div>
  )
}

// count = 0 の場合、レンダリング結果: <div></div>
// count = 5 の場合、レンダリング結果: <div><span class="badge">5</span></div>
```
