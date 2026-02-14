---
title: localStorage データのバージョン管理と最小化
impact: MEDIUM
impactDescription: スキーマの競合を防止し、ストレージサイズを削減
tags: client, localStorage, storage, versioning, data-minimization
---

## localStorage データのバージョン管理と最小化

キーにバージョンプレフィックスを追加し、必要なフィールドのみを保存します。スキーマの競合と機密データの意図しない保存を防止します。

**誤り：**

```typescript
// バージョンなし、すべてを保存、エラーハンドリングなし
localStorage.setItem('userConfig', JSON.stringify(fullUserObject))
const data = localStorage.getItem('userConfig')
```

**正しい：**

```typescript
const VERSION = 'v2'

function saveConfig(config: { theme: string; language: string }) {
  try {
    localStorage.setItem(`userConfig:${VERSION}`, JSON.stringify(config))
  } catch {
    // シークレットモード/プライベートブラウジング、容量超過、または無効の場合にスローされる
  }
}

function loadConfig() {
  try {
    const data = localStorage.getItem(`userConfig:${VERSION}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// v1 から v2 へのマイグレーション
function migrate() {
  try {
    const v1 = localStorage.getItem('userConfig:v1')
    if (v1) {
      const old = JSON.parse(v1)
      saveConfig({ theme: old.darkMode ? 'dark' : 'light', language: old.lang })
      localStorage.removeItem('userConfig:v1')
    }
  } catch {}
}
```

**サーバーレスポンスから最小限のフィールドを保存する：**

```typescript
// User オブジェクトには20以上のフィールドがあるが、UIに必要なものだけ保存する
function cachePrefs(user: FullUser) {
  try {
    localStorage.setItem('prefs:v1', JSON.stringify({
      theme: user.preferences.theme,
      notifications: user.preferences.notifications
    }))
  } catch {}
}
```

**常に try-catch で囲むこと：** `getItem()` と `setItem()` は、シークレットモード/プライベートブラウジング（Safari、Firefox）、容量超過、または無効の場合にスローされます。

**メリット：** バージョニングによるスキーマの進化、ストレージサイズの削減、トークン/PII/内部フラグの保存防止。
