---
title: render props よりも children によるコンポジションを優先する
impact: MEDIUM
impactDescription: よりクリーンなコンポジション、優れた可読性
tags: composition, children, render-props
---

## render props よりも children を優先する

コンポジションには `renderX` props ではなく `children` を使います。children のほうが可読性が高く、自然にコンポーズでき、コールバックシグネチャの理解を必要としません。

**悪い例（render props）:**

```tsx
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
}: {
  renderHeader?: () => React.ReactNode
  renderFooter?: () => React.ReactNode
  renderActions?: () => React.ReactNode
}) {
  return (
    <form>
      {renderHeader?.()}
      <Input />
      {renderFooter ? renderFooter() : <DefaultFooter />}
      {renderActions?.()}
    </form>
  )
}

// 使い方がぎこちなく柔軟性に欠ける
return (
  <Composer
    renderHeader={() => <CustomHeader />}
    renderFooter={() => (
      <>
        <Formatting />
        <Emojis />
      </>
    )}
    renderActions={() => <SubmitButton />}
  />
)
```

**良い例（children を使ったコンパウンドコンポーネント）:**

```tsx
function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}</form>
}

function ComposerFooter({ children }: { children: React.ReactNode }) {
  return <footer className='flex'>{children}</footer>
}

// 柔軟な使い方
return (
  <Composer.Frame>
    <CustomHeader />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Emojis />
      <SubmitButton />
    </Composer.Footer>
  </Composer.Frame>
)
```

**render props が適切な場合:**

```tsx
// render props はデータを返す必要がある場合にうまく機能する
<List
  data={items}
  renderItem={({ item, index }) => <Item item={item} index={index} />}
/>
```

親が子にデータや state を提供する必要がある場合は render props を使います。
静的な構造をコンポーズする場合は children を使います。
