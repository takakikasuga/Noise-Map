---
title: 遅延 state 初期化を使用する
impact: MEDIUM
impactDescription: レンダーごとに無駄な計算
tags: react, hooks, useState, performance, initialization
---

## 遅延 state 初期化を使用する

コストの高い初期値には `useState` に関数を渡してください。関数形式を使用しないと、値が一度しか使用されないにもかかわらず、イニシャライザがレンダーごとに実行されます。

**誤り（レンダーごとに実行される）：**

```tsx
function FilteredList({ items }: { items: Item[] }) {
  // buildSearchIndex() は初期化後も毎レンダーで実行される
  const [searchIndex, setSearchIndex] = useState(buildSearchIndex(items))
  const [query, setQuery] = useState('')

  // query が変更されると、buildSearchIndex が不必要に再実行される
  return <SearchResults index={searchIndex} query={query} />
}

function UserProfile() {
  // JSON.parse がレンダーごとに実行される
  const [settings, setSettings] = useState(
    JSON.parse(localStorage.getItem('settings') || '{}')
  )

  return <SettingsForm settings={settings} onChange={setSettings} />
}
```

**正しい（一度だけ実行される）：**

```tsx
function FilteredList({ items }: { items: Item[] }) {
  // buildSearchIndex() は初期レンダーでのみ実行される
  const [searchIndex, setSearchIndex] = useState(() => buildSearchIndex(items))
  const [query, setQuery] = useState('')

  return <SearchResults index={searchIndex} query={query} />
}

function UserProfile() {
  // JSON.parse は初期レンダーでのみ実行される
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('settings')
    return stored ? JSON.parse(stored) : {}
  })

  return <SettingsForm settings={settings} onChange={setSettings} />
}
```

localStorage/sessionStorage からの初期値の計算、データ構造（インデックス、Map）の構築、DOM からの読み取り、重い変換を行う場合に遅延初期化を使用してください。

シンプルなプリミティブ（`useState(0)`）、直接参照（`useState(props.value)`）、安価なリテラル（`useState({})`）の場合、関数形式は不要です。
