---
title: アプリの初期化はマウントごとではなく一度だけ行う
impact: LOW-MEDIUM
impactDescription: 開発環境での重複初期化を回避
tags: initialization, useEffect, app-startup, side-effects
---

## アプリの初期化はマウントごとではなく一度だけ行う

アプリ全体でアプリの読み込みごとに一度だけ実行する必要がある初期化をコンポーネントの `useEffect([])` 内に配置しないでください。コンポーネントは再マウントされる可能性があり、エフェクトは再実行されます。代わりに、モジュールレベルのガードまたはエントリモジュールのトップレベル初期化を使用してください。

**誤り（開発環境で2回実行され、再マウント時に再実行される）：**

```tsx
function Comp() {
  useEffect(() => {
    loadFromStorage()
    checkAuthToken()
  }, [])

  // ...
}
```

**正しい（アプリの読み込みごとに一度だけ）：**

```tsx
let didInit = false

function Comp() {
  useEffect(() => {
    if (didInit) return
    didInit = true
    loadFromStorage()
    checkAuthToken()
  }, [])

  // ...
}
```

参考：[アプリケーションの初期化](https://react.dev/learn/you-might-not-need-an-effect#initializing-the-application)
