---
title: 明示的なコンポーネントバリアントを作成する
impact: MEDIUM
impactDescription: 自己文書化するコード、隠れた条件分岐なし
tags: composition, variants, architecture
---

## 明示的なコンポーネントバリアントを作成する

多数の boolean props を持つ1つのコンポーネントではなく、明示的なバリアントコンポーネントを作成します。各バリアントは必要なパーツを組み合わせます。コードが自身を文書化します。

**悪い例（1つのコンポーネント、多数のモード）:**

```tsx
// このコンポーネントは実際に何をレンダリングする？
<Composer
  isThread
  isEditing={false}
  channelId='abc'
  showAttachments
  showFormatting={false}
/>
```

**良い例（明示的なバリアント）:**

```tsx
// 何がレンダリングされるか即座にわかる
<ThreadComposer channelId="abc" />

// または
<EditMessageComposer messageId="xyz" />

// または
<ForwardMessageComposer messageId="123" />
```

各実装はユニークで、明示的で、自己完結しています。それでいて共有パーツをそれぞれ利用できます。

**実装:**

```tsx
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <ThreadProvider channelId={channelId}>
      <Composer.Frame>
        <Composer.Input />
        <AlsoSendToChannelField channelId={channelId} />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.Submit />
        </Composer.Footer>
      </Composer.Frame>
    </ThreadProvider>
  )
}

function EditMessageComposer({ messageId }: { messageId: string }) {
  return (
    <EditMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.CancelEdit />
          <Composer.SaveEdit />
        </Composer.Footer>
      </Composer.Frame>
    </EditMessageProvider>
  )
}

function ForwardMessageComposer({ messageId }: { messageId: string }) {
  return (
    <ForwardMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input placeholder="Add a message, if you'd like." />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Emojis />
          <Composer.Mentions />
        </Composer.Footer>
      </Composer.Frame>
    </ForwardMessageProvider>
  )
}
```

各バリアントは以下について明示的です:

- どの Provider / state を使用するか
- どの UI 要素を含むか
- どのアクションが利用可能か

boolean props の組み合わせを推論する必要はありません。不可能な状態もありません。
