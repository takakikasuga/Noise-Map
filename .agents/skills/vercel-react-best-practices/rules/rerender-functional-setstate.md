---
title: 関数型 setState 更新を使用する
impact: MEDIUM
impactDescription: 古いクロージャと不要なコールバック再生成を防止
tags: react, hooks, useState, useCallback, callbacks, closures
---

## 関数型 setState 更新を使用する

現在の state 値に基づいて state を更新する場合、state 変数を直接参照する代わりに、setState の関数更新形式を使用してください。これにより、古いクロージャを防止し、不要な依存関係を排除し、安定したコールバック参照を作成します。

**誤り（state が依存関係として必要）：**

```tsx
function TodoList() {
  const [items, setItems] = useState(initialItems)

  // コールバックは items に依存し、items が変更されるたびに再生成される
  const addItems = useCallback((newItems: Item[]) => {
    setItems([...items, ...newItems])
  }, [items])  // items の依存関係が再生成を引き起こす

  // 依存関係を忘れると古いクロージャのリスク
  const removeItem = useCallback((id: string) => {
    setItems(items.filter(item => item.id !== id))
  }, [])  // items の依存関係が欠落 - 古い items を使用してしまう！

  return <ItemsEditor items={items} onAdd={addItems} onRemove={removeItem} />
}
```

最初のコールバックは `items` が変更されるたびに再生成され、子コンポーネントの不要な再レンダリングを引き起こす可能性があります。2番目のコールバックには古いクロージャバグがあり、常に初期の `items` 値を参照します。

**正しい（安定したコールバック、古いクロージャなし）：**

```tsx
function TodoList() {
  const [items, setItems] = useState(initialItems)

  // 安定したコールバック、再生成されない
  const addItems = useCallback((newItems: Item[]) => {
    setItems(curr => [...curr, ...newItems])
  }, [])  // 依存関係不要

  // 常に最新の state を使用、古いクロージャのリスクなし
  const removeItem = useCallback((id: string) => {
    setItems(curr => curr.filter(item => item.id !== id))
  }, [])  // 安全で安定

  return <ItemsEditor items={items} onAdd={addItems} onRemove={removeItem} />
}
```

**メリット：**

1. **安定したコールバック参照** - state が変更されてもコールバックを再生成する必要がない
2. **古いクロージャなし** - 常に最新の state 値で操作する
3. **依存関係の削減** - 依存配列をシンプルにし、メモリリークを削減する
4. **バグの防止** - React のクロージャバグの最も一般的な原因を排除する

**関数型更新を使用するタイミング：**

- 現在の state 値に依存するすべての setState
- state が必要な useCallback/useMemo 内
- state を参照するイベントハンドラ
- state を更新する非同期操作

**直接更新で問題ないタイミング：**

- 静的な値への state 設定：`setCount(0)`
- props/引数のみからの state 設定：`setName(newName)`
- state が前の値に依存しない場合

**注意：** プロジェクトで [React Compiler](https://react.dev/learn/react-compiler) が有効になっている場合、コンパイラは一部のケースを自動的に最適化できますが、正確性と古いクロージャバグの防止のために関数型更新は引き続き推奨されます。
