---
title: イミュータビリティのために sort() の代わりに toSorted() を使用する
impact: MEDIUM-HIGH
impactDescription: React の state におけるミューテーションバグを防止
tags: javascript, arrays, immutability, react, state, mutation
---

## イミュータビリティのために sort() の代わりに toSorted() を使用する

`.sort()` は配列をインプレースでミューテートするため、React の state と props でバグを引き起こす可能性があります。ミューテーションなしで新しいソート済み配列を作成するには `.toSorted()` を使用してください。

**誤り（元の配列をミューテートする）：**

```typescript
function UserList({ users }: { users: User[] }) {
  // users の props 配列をミューテートしてしまう！
  const sorted = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  )
  return <div>{sorted.map(renderUser)}</div>
}
```

**正しい（新しい配列を作成する）：**

```typescript
function UserList({ users }: { users: User[] }) {
  // 新しいソート済み配列を作成、元の配列は変更なし
  const sorted = useMemo(
    () => users.toSorted((a, b) => a.name.localeCompare(b.name)),
    [users]
  )
  return <div>{sorted.map(renderUser)}</div>
}
```

**React で重要な理由：**

1. Props/state のミューテーションは React のイミュータビリティモデルを壊す - React は props と state が読み取り専用として扱われることを期待している
2. 古いクロージャバグを引き起こす - クロージャ内（コールバック、エフェクト）で配列をミューテートすると予期しない動作につながる可能性がある

**ブラウザサポート（古いブラウザ向けのフォールバック）：**

`.toSorted()` はすべてのモダンブラウザで利用可能です（Chrome 110以降、Safari 16以降、Firefox 115以降、Node.js 20以降）。古い環境では、スプレッド演算子を使用してください：

```typescript
// 古いブラウザ向けのフォールバック
const sorted = [...items].sort((a, b) => a.value - b.value)
```

**その他のイミュータブル配列メソッド：**

- `.toSorted()` - イミュータブルなソート
- `.toReversed()` - イミュータブルなリバース
- `.toSpliced()` - イミュータブルなスプライス
- `.with()` - イミュータブルな要素の置換
