---
title: state 管理を UI から分離する
impact: MEDIUM
impactDescription: UI を変更せずに state 実装を差し替え可能にする
tags: composition, state, architecture
---

## state 管理を UI から分離する

Provider コンポーネントが state の管理方法を知る唯一の場所であるべきです。UI コンポーネントは context インターフェースを消費するだけで、state が useState、Zustand、サーバー同期のいずれから来るかは知りません。

**悪い例（UI が state 実装に結合している）:**

```tsx
function ChannelComposer({ channelId }: { channelId: string }) {
  // UI コンポーネントがグローバル state の実装を知っている
  const state = useGlobalChannelState(channelId)
  const { submit, updateInput } = useChannelSync(channelId)

  return (
    <Composer.Frame>
      <Composer.Input
        value={state.input}
        onChange={(text) => sync.updateInput(text)}
      />
      <Composer.Submit onPress={() => sync.submit()} />
    </Composer.Frame>
  )
}
```

**良い例（state 管理を Provider に隔離する）:**

```tsx
// Provider がすべての state 管理の詳細を処理する
function ChannelProvider({
  channelId,
  children,
}: {
  channelId: string
  children: React.ReactNode
}) {
  const { state, update, submit } = useGlobalChannel(channelId)
  const inputRef = useRef(null)

  return (
    <Composer.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  )
}

// UI コンポーネントは context インターフェースだけを知っている
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  )
}

// 使用例
function Channel({ channelId }: { channelId: string }) {
  return (
    <ChannelProvider channelId={channelId}>
      <ChannelComposer />
    </ChannelProvider>
  )
}
```

**異なる Provider、同じ UI:**

```tsx
// 一時的なフォーム用のローカル state
function ForwardMessageProvider({ children }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit: forwardMessage }}
    >
      {children}
    </Composer.Provider>
  )
}

// チャンネル用のグローバル同期 state
function ChannelProvider({ channelId, children }) {
  const { state, update, submit } = useGlobalChannel(channelId)

  return (
    <Composer.Provider state={state} actions={{ update, submit }}>
      {children}
    </Composer.Provider>
  )
}
```

同じ `Composer.Input` コンポーネントが両方の Provider で動作します。なぜなら、実装ではなく context インターフェースにのみ依存しているからです。
