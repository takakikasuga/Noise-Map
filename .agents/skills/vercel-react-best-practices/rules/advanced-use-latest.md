---
title: 安定したコールバック Ref のための useEffectEvent
impact: LOW
impactDescription: エフェクトの再実行を防止
tags: advanced, hooks, useEffectEvent, refs, optimization
---

## 安定したコールバック Ref のための useEffectEvent

依存配列に追加することなく、コールバック内で最新の値にアクセスします。古いクロージャを回避しながらエフェクトの再実行を防止します。

**誤り（コールバックが変更されるたびにエフェクトが再実行される）：**

```tsx
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => onSearch(query), 300)
    return () => clearTimeout(timeout)
  }, [query, onSearch])
}
```

**正しい（React の useEffectEvent を使用）：**

```tsx
import { useEffectEvent } from 'react';

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')
  const onSearchEvent = useEffectEvent(onSearch)

  useEffect(() => {
    const timeout = setTimeout(() => onSearchEvent(query), 300)
    return () => clearTimeout(timeout)
  }, [query])
}
```
