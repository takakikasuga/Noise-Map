---
title: インタラクションロジックをイベントハンドラに配置する
impact: MEDIUM
impactDescription: エフェクトの再実行と副作用の重複を回避
tags: rerender, useEffect, events, side-effects, dependencies
---

## インタラクションロジックをイベントハンドラに配置する

副作用が特定のユーザーアクション（送信、クリック、ドラッグ）によってトリガーされる場合、そのイベントハンドラ内で実行してください。アクションを state + エフェクトとしてモデル化しないでください。無関係な変更でエフェクトが再実行され、アクションが重複する可能性があります。

**誤り（イベントが state + エフェクトとしてモデル化されている）：**

```tsx
function Form() {
  const [submitted, setSubmitted] = useState(false)
  const theme = useContext(ThemeContext)

  useEffect(() => {
    if (submitted) {
      post('/api/register')
      showToast('Registered', theme)
    }
  }, [submitted, theme])

  return <button onClick={() => setSubmitted(true)}>Submit</button>
}
```

**正しい（ハンドラ内で実行する）：**

```tsx
function Form() {
  const theme = useContext(ThemeContext)

  function handleSubmit() {
    post('/api/register')
    showToast('Registered', theme)
  }

  return <button onClick={handleSubmit}>Submit</button>
}
```

参考：[Should this code move to an event handler?](https://react.dev/learn/removing-effect-dependencies#should-this-code-move-to-an-event-handler)
