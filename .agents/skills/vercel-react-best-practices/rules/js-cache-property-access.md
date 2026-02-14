---
title: ループ内のプロパティアクセスをキャッシュする
impact: LOW-MEDIUM
impactDescription: ルックアップを削減
tags: javascript, loops, optimization, caching
---

## ループ内のプロパティアクセスをキャッシュする

ホットパスでオブジェクトプロパティのルックアップをキャッシュします。

**誤り（3回のルックアップ x N回のイテレーション）：**

```typescript
for (let i = 0; i < arr.length; i++) {
  process(obj.config.settings.value)
}
```

**正しい（合計1回のルックアップ）：**

```typescript
const value = obj.config.settings.value
const len = arr.length
for (let i = 0; i < len; i++) {
  process(value)
}
```
