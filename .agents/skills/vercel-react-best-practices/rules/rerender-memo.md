---
title: メモ化コンポーネントに抽出する
impact: MEDIUM
impactDescription: 早期リターンを可能にする
tags: rerender, memo, useMemo, optimization
---

## メモ化コンポーネントに抽出する

計算前の早期リターンを可能にするために、コストの高い処理をメモ化コンポーネントに抽出します。

**誤り（ローディング中でもアバターを計算する）：**

```tsx
function Profile({ user, loading }: Props) {
  const avatar = useMemo(() => {
    const id = computeAvatarId(user)
    return <Avatar id={id} />
  }, [user])

  if (loading) return <Skeleton />
  return <div>{avatar}</div>
}
```

**正しい（ローディング時は計算をスキップする）：**

```tsx
const UserAvatar = memo(function UserAvatar({ user }: { user: User }) {
  const id = useMemo(() => computeAvatarId(user), [user])
  return <Avatar id={id} />
})

function Profile({ user, loading }: Props) {
  if (loading) return <Skeleton />
  return (
    <div>
      <UserAvatar user={user} />
    </div>
  )
}
```

**注意：** プロジェクトで [React Compiler](https://react.dev/learn/react-compiler) が有効になっている場合、`memo()` と `useMemo()` による手動のメモ化は不要です。コンパイラが自動的に再レンダリングを最適化します。
