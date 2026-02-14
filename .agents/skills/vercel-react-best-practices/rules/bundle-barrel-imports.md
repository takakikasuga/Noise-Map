---
title: バレルファイルインポートを避ける
impact: CRITICAL
impactDescription: 200〜800msのインポートコスト、ビルドの低速化
tags: bundle, imports, tree-shaking, barrel-files, performance
---

## バレルファイルインポートを避ける

未使用の大量のモジュールのロードを避けるために、バレルファイルではなくソースファイルから直接インポートしてください。**バレルファイル**とは、複数のモジュールを再エクスポートするエントリポイントです（例：`export * from './module'` を行う `index.js`）。

人気のあるアイコンおよびコンポーネントライブラリは、エントリファイルに**最大10,000の再エクスポート**を持つことがあります。多くの React パッケージでは、**インポートだけで200〜800msかかり**、開発速度と本番のコールドスタートの両方に影響します。

**ツリーシェイキングが役に立たない理由：** ライブラリが external（バンドルされない）としてマークされている場合、バンドラは最適化できません。ツリーシェイキングを有効にするためにバンドルすると、モジュールグラフ全体の解析によりビルドが大幅に遅くなります。

**誤り（ライブラリ全体をインポートする）：**

```tsx
import { Check, X, Menu } from 'lucide-react'
// 1,583モジュールをロード、開発環境で約2.8秒の追加時間
// ランタイムコスト：コールドスタートごとに200〜800ms

import { Button, TextField } from '@mui/material'
// 2,225モジュールをロード、開発環境で約4.2秒の追加時間
```

**正しい（必要なものだけインポートする）：**

```tsx
import Check from 'lucide-react/dist/esm/icons/check'
import X from 'lucide-react/dist/esm/icons/x'
import Menu from 'lucide-react/dist/esm/icons/menu'
// 3モジュールのみロード（約1MBに対して約2KB）

import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
// 使用するものだけロード
```

**代替案（Next.js 13.5以降）：**

```js
// next.config.js - optimizePackageImports を使用
module.exports = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@mui/material']
  }
}

// その後、使いやすいバレルインポートをそのまま使用可能：
import { Check, X, Menu } from 'lucide-react'
// ビルド時に自動的に直接インポートに変換される
```

直接インポートにより、開発ブートが15〜70%高速化、ビルドが28%高速化、コールドスタートが40%高速化、HMRも大幅に高速化されます。

よく影響を受けるライブラリ：`lucide-react`、`@mui/material`、`@mui/icons-material`、`@tabler/icons-react`、`react-icons`、`@headlessui/react`、`@radix-ui/react-*`、`lodash`、`ramda`、`date-fns`、`rxjs`、`react-use`。

参考：[How we optimized package imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
