---
title: 表示/非表示に Activity コンポーネントを使用する
impact: MEDIUM
impactDescription: state/DOM を保持
tags: rendering, activity, visibility, state-preservation
---

## 表示/非表示に Activity コンポーネントを使用する

頻繁に表示/非表示が切り替わるコストの高いコンポーネントの state/DOM を保持するために、React の `<Activity>` を使用します。

**使い方：**

```tsx
import { Activity } from 'react'

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? 'visible' : 'hidden'}>
      <ExpensiveMenu />
    </Activity>
  )
}
```

コストの高い再レンダリングと state の喪失を回避します。
