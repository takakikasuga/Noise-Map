---

title: メモ化コンポーネントのデフォルトの非プリミティブパラメータ値を定数に抽出する
impact: MEDIUM
impactDescription: デフォルト値に定数を使用してメモ化を復元
tags: rerender, memo, optimization

---

## メモ化コンポーネントのデフォルトの非プリミティブパラメータ値を定数に抽出する

メモ化コンポーネントが配列、関数、オブジェクトなどの非プリミティブなオプショナルパラメータにデフォルト値を持つ場合、そのパラメータなしでコンポーネントを呼び出すとメモ化が壊れます。これは、再レンダーごとに新しい値のインスタンスが作成され、`memo()` の厳密等価比較を通過しないためです。

この問題を解決するには、デフォルト値を定数に抽出してください。

**誤り（`onClick` は再レンダーごとに異なる値を持つ）：**

```tsx
const UserAvatar = memo(function UserAvatar({ onClick = () => {} }: { onClick?: () => void }) {
  // ...
})

// オプショナルな onClick なしで使用
<UserAvatar />
```

**正しい（安定したデフォルト値）：**

```tsx
const NOOP = () => {};

const UserAvatar = memo(function UserAvatar({ onClick = NOOP }: { onClick?: () => void }) {
  // ...
})

// オプショナルな onClick なしで使用
<UserAvatar />
```
