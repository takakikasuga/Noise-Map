---
title: 複数の配列イテレーションをまとめる
impact: LOW-MEDIUM
impactDescription: イテレーション回数を削減
tags: javascript, arrays, loops, performance
---

## 複数の配列イテレーションをまとめる

複数の `.filter()` や `.map()` 呼び出しは配列を複数回イテレートします。1つのループにまとめてください。

**誤り（3回のイテレーション）：**

```typescript
const admins = users.filter(u => u.isAdmin)
const testers = users.filter(u => u.isTester)
const inactive = users.filter(u => !u.isActive)
```

**正しい（1回のイテレーション）：**

```typescript
const admins: User[] = []
const testers: User[] = []
const inactive: User[] = []

for (const user of users) {
  if (user.isAdmin) admins.push(user)
  if (user.isTester) testers.push(user)
  if (!user.isActive) inactive.push(user)
}
```
