---
title: 配列比較の前に長さチェックを先に行う
impact: MEDIUM-HIGH
impactDescription: 長さが異なる場合にコストの高い操作を回避
tags: javascript, arrays, performance, optimization, comparison
---

## 配列比較の前に長さチェックを先に行う

コストの高い操作（ソート、ディープイコーリティ、シリアライゼーション）で配列を比較する場合、まず長さをチェックします。長さが異なれば、配列は等しくありません。

実際のアプリケーションでは、この最適化は比較がホットパス（イベントハンドラ、レンダーループ）で実行される場合に特に有効です。

**誤り（常にコストの高い比較を実行する）：**

```typescript
function hasChanges(current: string[], original: string[]) {
  // 長さが異なっても常にソートして結合する
  return current.sort().join() !== original.sort().join()
}
```

`current.length` が5で `original.length` が100でも、2回の O(n log n) ソートが実行されます。配列の結合と文字列の比較のオーバーヘッドもあります。

**正しい（O(1) の長さチェックを先に行う）：**

```typescript
function hasChanges(current: string[], original: string[]) {
  // 長さが異なれば早期リターン
  if (current.length !== original.length) {
    return true
  }
  // 長さが一致した場合のみソート
  const currentSorted = current.toSorted()
  const originalSorted = original.toSorted()
  for (let i = 0; i < currentSorted.length; i++) {
    if (currentSorted[i] !== originalSorted[i]) {
      return true
    }
  }
  return false
}
```

この新しいアプローチがより効率的な理由：
- 長さが異なる場合にソートと結合のオーバーヘッドを回避する
- 結合された文字列のメモリ消費を回避する（特に大きな配列で重要）
- 元の配列のミューテーションを回避する
- 差異が見つかった時点で早期リターンする
