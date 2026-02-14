---
title: 関数からの早期リターン
impact: LOW-MEDIUM
impactDescription: 不要な計算を回避
tags: javascript, functions, optimization, early-return
---

## 関数からの早期リターン

結果が確定した時点で早期リターンし、不要な処理をスキップします。

**誤り（答えが見つかった後もすべてのアイテムを処理する）：**

```typescript
function validateUsers(users: User[]) {
  let hasError = false
  let errorMessage = ''

  for (const user of users) {
    if (!user.email) {
      hasError = true
      errorMessage = 'Email required'
    }
    if (!user.name) {
      hasError = true
      errorMessage = 'Name required'
    }
    // エラーが見つかった後もすべてのユーザーのチェックを続ける
  }

  return hasError ? { valid: false, error: errorMessage } : { valid: true }
}
```

**正しい（最初のエラーで即座にリターンする）：**

```typescript
function validateUsers(users: User[]) {
  for (const user of users) {
    if (!user.email) {
      return { valid: false, error: 'Email required' }
    }
    if (!user.name) {
      return { valid: false, error: 'Name required' }
    }
  }

  return { valid: true }
}
```
