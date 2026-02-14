---
title: SWR で自動重複排除を行う
impact: MEDIUM-HIGH
impactDescription: 自動重複排除
tags: client, swr, deduplication, data-fetching
---

## SWR で自動重複排除を行う

SWR はコンポーネントインスタンス間でリクエストの重複排除、キャッシュ、再検証を実現します。

**誤り（重複排除なし、各インスタンスがフェッチする）：**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])
}
```

**正しい（複数のインスタンスが1つのリクエストを共有する）：**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users } = useSWR('/api/users', fetcher)
}
```

**イミュータブルデータの場合：**

```tsx
import { useImmutableSWR } from '@/lib/swr'

function StaticContent() {
  const { data } = useImmutableSWR('/api/config', fetcher)
}
```

**ミューテーションの場合：**

```tsx
import { useSWRMutation } from 'swr/mutation'

function UpdateButton() {
  const { trigger } = useSWRMutation('/api/user', updateUser)
  return <button onClick={() => trigger()}>Update</button>
}
```

参考：[https://swr.vercel.app](https://swr.vercel.app)
