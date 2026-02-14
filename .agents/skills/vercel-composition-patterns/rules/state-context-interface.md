---
title: 依存性注入のための汎用 Context インターフェースを定義する
impact: HIGH
impactDescription: ユースケースをまたいだ依存性注入可能な state を実現する
tags: composition, context, state, typescript, dependency-injection
---

## 依存性注入のための汎用 Context インターフェースを定義する

コンポーネント context の**汎用インターフェース**を `state`、`actions`、`meta` の3つのパートで定義します。このインターフェースはどの Provider でも実装できる契約であり、同じ UI コンポーネントがまったく異なる state 実装で動作することを可能にします。

**核心原則:** state をリフトアップし、内部をコンポーズし、state を依存性注入可能にする。

**悪い例（UI が特定の state 実装に結合している）:**

```tsx
function ComposerInput() {
  // 特定のフックに密結合している
  const { input, setInput } = useChannelComposerState()
  return <TextInput value={input} onChangeText={setInput} />
}
```

**良い例（汎用インターフェースが依存性注入を実現する）:**

```tsx
// 任意の Provider が実装できる汎用インターフェースを定義
interface ComposerState {
  input: string
  attachments: Attachment[]
  isSubmitting: boolean
}

interface ComposerActions {
  update: (updater: (state: ComposerState) => ComposerState) => void
  submit: () => void
}

interface ComposerMeta {
  inputRef: React.RefObject<TextInput>
}

interface ComposerContextValue {
  state: ComposerState
  actions: ComposerActions
  meta: ComposerMeta
}

const ComposerContext = createContext<ComposerContextValue | null>(null)
```

**UI コンポーネントは実装ではなくインターフェースを消費する:**

```tsx
function ComposerInput() {
  const {
    state,
    actions: { update },
    meta,
  } = use(ComposerContext)

  // このコンポーネントはインターフェースを実装する任意の Provider で動作する
  return (
    <TextInput
      ref={meta.inputRef}
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    />
  )
}
```

**異なる Provider が同じインターフェースを実装する:**

```tsx
// Provider A: 一時的なフォーム用のローカル state
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const inputRef = useRef(null)
  const submit = useForwardMessage()

  return (
    <ComposerContext
      value={{
        state,
        actions: { update: setState, submit },
        meta: { inputRef },
      }}
    >
      {children}
    </ComposerContext>
  )
}

// Provider B: チャンネル用のグローバル同期 state
function ChannelProvider({ channelId, children }: Props) {
  const { state, update, submit } = useGlobalChannel(channelId)
  const inputRef = useRef(null)

  return (
    <ComposerContext
      value={{
        state,
        actions: { update, submit },
        meta: { inputRef },
      }}
    >
      {children}
    </ComposerContext>
  )
}
```

**同じコンポジション済み UI が両方で動作する:**

```tsx
// ForwardMessageProvider（ローカル state）で動作
<ForwardMessageProvider>
  <Composer.Frame>
    <Composer.Input />
    <Composer.Submit />
  </Composer.Frame>
</ForwardMessageProvider>

// ChannelProvider（グローバル同期 state）で動作
<ChannelProvider channelId="abc">
  <Composer.Frame>
    <Composer.Input />
    <Composer.Submit />
  </Composer.Frame>
</ChannelProvider>
```

**コンポーネント外部のカスタム UI から state とアクションにアクセスできる:**

重要なのは Provider の境界であり、視覚的なネストではありません。共有 state を必要とするコンポーネントは `Composer.Frame` の内側にある必要はなく、Provider の内側にあれば十分です。

```tsx
function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        {/* コンポーザー UI */}
        <Composer.Frame>
          <Composer.Input placeholder="Add a message, if you'd like." />
          <Composer.Footer>
            <Composer.Formatting />
            <Composer.Emojis />
          </Composer.Footer>
        </Composer.Frame>

        {/* コンポーザーの外側だが Provider の内側にあるカスタム UI */}
        <MessagePreview />

        {/* ダイアログ下部のアクション */}
        <DialogActions>
          <CancelButton />
          <ForwardButton />
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  )
}

// このボタンは Composer.Frame の外側にあるが、context を通じて submit を呼び出せる！
function ForwardButton() {
  const {
    actions: { submit },
  } = use(ComposerContext)
  return <Button onPress={submit}>Forward</Button>
}

// このプレビューは Composer.Frame の外側にあるが、コンポーザーの state を読める！
function MessagePreview() {
  const { state } = use(ComposerContext)
  return <Preview message={state.input} attachments={state.attachments} />
}
```

`ForwardButton` と `MessagePreview` は視覚的にはコンポーザーボックスの内側にありませんが、その state とアクションにアクセスできます。これが state を Provider にリフトアップすることの力です。

UI は組み合わせて使う再利用可能なパーツです。state は Provider によって依存性注入されます。Provider を差し替えても、UI はそのまま使えます。
