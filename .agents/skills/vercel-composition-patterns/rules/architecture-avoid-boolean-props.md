---
title: boolean props の増殖を避ける
impact: CRITICAL
impactDescription: メンテナンス不能なコンポーネントバリアントを防ぐ
tags: composition, props, architecture
---

## boolean props の増殖を避ける

`isThread`、`isEditing`、`isDMThread` のような boolean props を追加してコンポーネントの振る舞いをカスタマイズしてはいけません。各 boolean は可能な状態を倍増させ、メンテナンス不能な条件分岐ロジックを生み出します。代わりにコンポジションを使いましょう。

**悪い例（boolean props が指数関数的な複雑さを生む）:**

```tsx
function Composer({
  onSubmit,
  isThread,
  channelId,
  isDMThread,
  dmId,
  isEditing,
  isForwarding,
}: Props) {
  return (
    <form>
      <Header />
      <Input />
      {isDMThread ? (
        <AlsoSendToDMField id={dmId} />
      ) : isThread ? (
        <AlsoSendToChannelField id={channelId} />
      ) : null}
      {isEditing ? (
        <EditActions />
      ) : isForwarding ? (
        <ForwardActions />
      ) : (
        <DefaultActions />
      )}
      <Footer onSubmit={onSubmit} />
    </form>
  )
}
```

**良い例（コンポジションが条件分岐を排除する）:**

```tsx
// チャンネルコンポーザー
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// スレッドコンポーザー - 「チャンネルにも送信」フィールドを追加
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <AlsoSendToChannelField id={channelId} />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// 編集コンポーザー - フッターのアクションが異なる
function EditComposer() {
  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.CancelEdit />
        <Composer.SaveEdit />
      </Composer.Footer>
    </Composer.Frame>
  )
}
```

各バリアントは何をレンダリングするか明示的です。単一のモノリシックな親を共有することなく、内部の部品を共有できます。
