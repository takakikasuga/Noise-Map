---
title: レイアウトスラッシングを避ける
impact: MEDIUM
impactDescription: 強制的な同期レイアウトを防止し、パフォーマンスのボトルネックを削減
tags: javascript, dom, css, performance, reflow, layout-thrashing
---

## レイアウトスラッシングを避ける

スタイルの書き込みとレイアウトの読み取りを交互に行わないでください。スタイルの変更の間にレイアウトプロパティ（`offsetWidth`、`getBoundingClientRect()`、`getComputedStyle()` など）を読み取ると、ブラウザは同期的なリフローを強制的にトリガーします。

**これは OK（ブラウザがスタイルの変更をバッチ処理する）：**
```typescript
function updateElementStyles(element: HTMLElement) {
  // 各行がスタイルを無効化するが、ブラウザが再計算をバッチ処理する
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'
}
```

**誤り（読み取りと書き込みの交互がリフローを強制する）：**
```typescript
function layoutThrashing(element: HTMLElement) {
  element.style.width = '100px'
  const width = element.offsetWidth  // リフローを強制
  element.style.height = '200px'
  const height = element.offsetHeight  // 別のリフローを強制
}
```

**正しい（書き込みをバッチ処理してから一度だけ読み取る）：**
```typescript
function updateElementStyles(element: HTMLElement) {
  // すべての書き込みをまとめる
  element.style.width = '100px'
  element.style.height = '200px'
  element.style.backgroundColor = 'blue'
  element.style.border = '1px solid black'

  // すべての書き込みが完了した後に読み取る（単一のリフロー）
  const { width, height } = element.getBoundingClientRect()
}
```

**正しい（読み取りをバッチ処理してから書き込む）：**
```typescript
function avoidThrashing(element: HTMLElement) {
  // 読み取りフェーズ - すべてのレイアウトクエリを先に
  const rect1 = element.getBoundingClientRect()
  const offsetWidth = element.offsetWidth
  const offsetHeight = element.offsetHeight

  // 書き込みフェーズ - すべてのスタイル変更を後に
  element.style.width = '100px'
  element.style.height = '200px'
}
```

**より良い方法：CSS クラスを使用する**
```css
.highlighted-box {
  width: 100px;
  height: 200px;
  background-color: blue;
  border: 1px solid black;
}
```
```typescript
function updateElementStyles(element: HTMLElement) {
  element.classList.add('highlighted-box')

  const { width, height } = element.getBoundingClientRect()
}
```

**React の例：**
```tsx
// 誤り：スタイル変更とレイアウトクエリの交互
function Box({ isHighlighted }: { isHighlighted: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && isHighlighted) {
      ref.current.style.width = '100px'
      const width = ref.current.offsetWidth // レイアウトを強制
      ref.current.style.height = '200px'
    }
  }, [isHighlighted])

  return <div ref={ref}>Content</div>
}

// 正しい：クラスの切り替え
function Box({ isHighlighted }: { isHighlighted: boolean }) {
  return (
    <div className={isHighlighted ? 'highlighted-box' : ''}>
      Content
    </div>
  )
}
```

可能な限りインラインスタイルよりも CSS クラスを優先してください。CSS ファイルはブラウザによってキャッシュされ、クラスはより良い関心の分離を提供し、メンテナンスが容易です。

詳しくは [this gist](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) と [CSS Triggers](https://csstriggers.com/) を参照してください。
