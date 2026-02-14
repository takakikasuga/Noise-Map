---
title: グローバルイベントリスナーの重複排除
impact: LOW
impactDescription: N個のコンポーネントに対して1つのリスナー
tags: client, swr, event-listeners, subscription
---

## グローバルイベントリスナーの重複排除

`useSWRSubscription()` を使用して、コンポーネントインスタンス間でグローバルイベントリスナーを共有します。

**誤り（N個のインスタンス = N個のリスナー）：**

```tsx
function useKeyboardShortcut(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === key) {
        callback()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback])
}
```

`useKeyboardShortcut` フックを複数回使用すると、各インスタンスが新しいリスナーを登録します。

**正しい（N個のインスタンス = 1つのリスナー）：**

```tsx
import useSWRSubscription from 'swr/subscription'

// キーごとのコールバックを追跡するモジュールレベルの Map
const keyCallbacks = new Map<string, Set<() => void>>()

function useKeyboardShortcut(key: string, callback: () => void) {
  // このコールバックを Map に登録
  useEffect(() => {
    if (!keyCallbacks.has(key)) {
      keyCallbacks.set(key, new Set())
    }
    keyCallbacks.get(key)!.add(callback)

    return () => {
      const set = keyCallbacks.get(key)
      if (set) {
        set.delete(callback)
        if (set.size === 0) {
          keyCallbacks.delete(key)
        }
      }
    }
  }, [key, callback])

  useSWRSubscription('global-keydown', () => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey && keyCallbacks.has(e.key)) {
        keyCallbacks.get(e.key)!.forEach(cb => cb())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })
}

function Profile() {
  // 複数のショートカットが同じリスナーを共有する
  useKeyboardShortcut('p', () => { /* ... */ })
  useKeyboardShortcut('k', () => { /* ... */ })
  // ...
}
```
