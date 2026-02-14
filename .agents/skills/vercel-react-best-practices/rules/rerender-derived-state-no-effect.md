---
title: レンダリング中に派生 state を計算する
impact: MEDIUM
impactDescription: 冗長なレンダリングと state のドリフトを回避
tags: rerender, derived-state, useEffect, state
---

## レンダリング中に派生 state を計算する

現在の props/state から計算できる値は、state に格納したりエフェクトで更新したりしないでください。余分なレンダリングと state のドリフトを避けるために、レンダリング中に導出してください。props の変更に応じてのみエフェクトで state を設定することは避け、派生値やキーリセットを優先してください。

**誤り（冗長な state とエフェクト）：**

```tsx
function Form() {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    setFullName(firstName + ' ' + lastName)
  }, [firstName, lastName])

  return <p>{fullName}</p>
}
```

**正しい（レンダリング中に導出する）：**

```tsx
function Form() {
  const [firstName, setFirstName] = useState('First')
  const [lastName, setLastName] = useState('Last')
  const fullName = firstName + ' ' + lastName

  return <p>{fullName}</p>
}
```

参考：[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
