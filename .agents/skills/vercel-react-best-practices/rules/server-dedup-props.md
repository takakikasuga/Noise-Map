---
title: RSC Props での重複シリアライズを避ける
impact: LOW
impactDescription: 重複シリアライズを回避してネットワークペイロードを削減
tags: server, rsc, serialization, props, client-components
---

## RSC Props での重複シリアライズを避ける

**影響：LOW（重複シリアライズを回避してネットワークペイロードを削減）**

RSC からクライアントへのシリアライゼーションは、値ではなくオブジェクト参照で重複排除されます。同じ参照 = 一度だけシリアライズ、新しい参照 = 再度シリアライズ。変換（`.toSorted()`、`.filter()`、`.map()`）はサーバーではなくクライアントで行ってください。

**誤り（配列を重複させる）：**

```tsx
// RSC：6つの文字列を送信（2つの配列 x 3つのアイテム）
<ClientList usernames={usernames} usernamesOrdered={usernames.toSorted()} />
```

**正しい（3つの文字列を送信）：**

```tsx
// RSC：一度だけ送信
<ClientList usernames={usernames} />

// クライアント：そこで変換
'use client'
const sorted = useMemo(() => [...usernames].sort(), [usernames])
```

**ネストされた重複排除の動作：**

重複排除は再帰的に動作します。影響はデータ型によって異なります：

- `string[]`、`number[]`、`boolean[]`：**HIGH インパクト** - 配列 + すべてのプリミティブが完全に重複
- `object[]`：**LOW インパクト** - 配列は重複するが、ネストされたオブジェクトは参照で重複排除

```tsx
// string[] - すべてを重複させる
usernames={['a','b']} sorted={usernames.toSorted()} // 4つの文字列を送信

// object[] - 配列構造のみ重複
users={[{id:1},{id:2}]} sorted={users.toSorted()} // 2つの配列 + 2つのユニークオブジェクトを送信（4つではない）
```

**重複排除を壊す操作（新しい参照を作成）：**

- 配列：`.toSorted()`、`.filter()`、`.map()`、`.slice()`、`[...arr]`
- オブジェクト：`{...obj}`、`Object.assign()`、`structuredClone()`、`JSON.parse(JSON.stringify())`

**その他の例：**

```tsx
// 誤り
<C users={users} active={users.filter(u => u.active)} />
<C product={product} productName={product.name} />

// 正しい
<C users={users} />
<C product={product} />
// フィルタリング/分割代入はクライアントで行う
```

**例外：** 変換がコストの高い場合や、クライアントが元のデータを必要としない場合は、派生データを渡してください。
