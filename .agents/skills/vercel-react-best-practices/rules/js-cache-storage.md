---
title: Storage API の呼び出しをキャッシュする
impact: LOW-MEDIUM
impactDescription: コストの高い I/O を削減
tags: javascript, localStorage, storage, caching, performance
---

## Storage API の呼び出しをキャッシュする

`localStorage`、`sessionStorage`、`document.cookie` は同期的でコストが高いです。読み取りをメモリにキャッシュしてください。

**誤り（呼び出しごとにストレージを読み取る）：**

```typescript
function getTheme() {
  return localStorage.getItem('theme') ?? 'light'
}
// 10回呼び出し = 10回のストレージ読み取り
```

**正しい（Map キャッシュ）：**

```typescript
const storageCache = new Map<string, string | null>()

function getLocalStorage(key: string) {
  if (!storageCache.has(key)) {
    storageCache.set(key, localStorage.getItem(key))
  }
  return storageCache.get(key)
}

function setLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value)
  storageCache.set(key, value)  // キャッシュを同期に保つ
}
```

Map（フックではなく）を使用することで、ユーティリティ、イベントハンドラなど、React コンポーネントだけでなくあらゆる場所で動作します。

**Cookie のキャッシュ：**

```typescript
let cookieCache: Record<string, string> | null = null

function getCookie(name: string) {
  if (!cookieCache) {
    cookieCache = Object.fromEntries(
      document.cookie.split('; ').map(c => c.split('='))
    )
  }
  return cookieCache[name]
}
```

**重要（外部の変更時にキャッシュを無効化する）：**

ストレージが外部から変更される可能性がある場合（別のタブ、サーバー設定の Cookie）、キャッシュを無効化してください：

```typescript
window.addEventListener('storage', (e) => {
  if (e.key) storageCache.delete(e.key)
})

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    storageCache.clear()
  }
})
```
