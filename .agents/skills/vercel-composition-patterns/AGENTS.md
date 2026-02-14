# React コンポジションパターン

**バージョン 1.0.0**
エンジニアリング
2026年1月

> **注意:**
> このドキュメントは主にエージェントや LLM が React のコードベースを
> コンポジションを用いて保守、生成、リファクタリングする際に従うためのものです。
> 人間にとっても有用ですが、ここでのガイダンスは AI アシストワークフローによる
> 自動化と一貫性のために最適化されています。

---

## 概要

柔軟でメンテナンスしやすい React コンポーネントを構築するためのコンポジションパターンです。コンパウンドコンポーネント、state のリフトアップ、内部のコンポジションを活用して、boolean props の増殖を防ぎます。これらのパターンにより、コードベースはスケールしても人間と AI エージェントの両方にとって扱いやすくなります。

---

## 目次

1. [コンポーネントアーキテクチャ](#1-コンポーネントアーキテクチャ) — **HIGH**
   - 1.1 [boolean props の増殖を避ける](#11-boolean-props-の増殖を避ける)
   - 1.2 [コンパウンドコンポーネントを使う](#12-コンパウンドコンポーネントを使う)
2. [state 管理](#2-state-管理) — **MEDIUM**
   - 2.1 [state 管理を UI から分離する](#21-state-管理を-ui-から分離する)
   - 2.2 [依存性注入のための汎用 Context インターフェースを定義する](#22-依存性注入のための汎用-context-インターフェースを定義する)
   - 2.3 [state を Provider コンポーネントにリフトアップする](#23-state-を-provider-コンポーネントにリフトアップする)
3. [実装パターン](#3-実装パターン) — **MEDIUM**
   - 3.1 [明示的なコンポーネントバリアントを作成する](#31-明示的なコンポーネントバリアントを作成する)
   - 3.2 [render props よりも children によるコンポジションを優先する](#32-render-props-よりも-children-によるコンポジションを優先する)
4. [React 19 API](#4-react-19-api) — **MEDIUM**
   - 4.1 [React 19 API の変更点](#41-react-19-api-の変更点)

---

## 1. コンポーネントアーキテクチャ

**影響度: HIGH**

props の増殖を防ぎ、柔軟なコンポジションを可能にするための
コンポーネント構造化の基本パターンです。

### 1.1 boolean props の増殖を避ける

**影響度: CRITICAL（メンテナンス不能なコンポーネントバリアントを防ぐ）**

`isThread`、`isEditing`、`isDMThread` のような boolean props を追加して

コンポーネントの振る舞いをカスタマイズしてはいけません。各 boolean は可能な状態を倍増させ、

メンテナンス不能な条件分岐ロジックを生み出します。代わりにコンポジションを使いましょう。

**悪い例: boolean props が指数関数的な複雑さを生む**

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

**良い例: コンポジションが条件分岐を排除する**

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

各バリアントは何をレンダリングするか明示的です。内部の部品を共有しながらも、

単一のモノリシックな親を共有する必要はありません。

### 1.2 コンパウンドコンポーネントを使う

**影響度: HIGH（props のバケツリレーなしで柔軟なコンポジションを実現する）**

複雑なコンポーネントは共有 context を持つコンパウンドコンポーネントとして構造化します。各

サブコンポーネントは props ではなく context を通じて共有 state にアクセスします。利用者は

必要なパーツを組み合わせます。

**悪い例: render props を使ったモノリシックなコンポーネント**

```tsx
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
  showAttachments,
  showFormatting,
  showEmojis,
}: Props) {
  return (
    <form>
      {renderHeader?.()}
      <Input />
      {showAttachments && <Attachments />}
      {renderFooter ? (
        renderFooter()
      ) : (
        <Footer>
          {showFormatting && <Formatting />}
          {showEmojis && <Emojis />}
          {renderActions?.()}
        </Footer>
      )}
    </form>
  )
}
```

**良い例: 共有 context を持つコンパウンドコンポーネント**

```tsx
const ComposerContext = createContext<ComposerContextValue | null>(null)

function ComposerProvider({ children, state, actions, meta }: ProviderProps) {
  return (
    <ComposerContext value={{ state, actions, meta }}>
      {children}
    </ComposerContext>
  )
}

function ComposerFrame({ children }: { children: React.ReactNode }) {
  return <form>{children}</form>
}

function ComposerInput() {
  const {
    state,
    actions: { update },
    meta: { inputRef },
  } = use(ComposerContext)
  return (
    <TextInput
      ref={inputRef}
      value={state.input}
      onChangeText={(text) => update((s) => ({ ...s, input: text }))}
    />
  )
}

function ComposerSubmit() {
  const {
    actions: { submit },
  } = use(ComposerContext)
  return <Button onPress={submit}>Send</Button>
}

// コンパウンドコンポーネントとしてエクスポート
const Composer = {
  Provider: ComposerProvider,
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
  Header: ComposerHeader,
  Footer: ComposerFooter,
  Attachments: ComposerAttachments,
  Formatting: ComposerFormatting,
  Emojis: ComposerEmojis,
}
```

**使用例:**

```tsx
<Composer.Provider state={state} actions={actions} meta={meta}>
  <Composer.Frame>
    <Composer.Header />
    <Composer.Input />
    <Composer.Footer>
      <Composer.Formatting />
      <Composer.Submit />
    </Composer.Footer>
  </Composer.Frame>
</Composer.Provider>
```

利用者は必要なものだけを明示的に組み合わせます。隠れた条件分岐はありません。そして state、actions、meta は親の Provider によって依存性注入されるため、同じコンポーネント構造を複数の用途で利用できます。

---

## 2. state 管理

**影響度: MEDIUM**

state のリフトアップと、コンポジションされたコンポーネント間での
共有 context の管理パターンです。

### 2.1 state 管理を UI から分離する

**影響度: MEDIUM（UI を変更せずに state 実装を差し替え可能にする）**

Provider コンポーネントが state の管理方法を知る唯一の場所であるべきです。

UI コンポーネントは context インターフェースを消費するだけで、state が

useState、Zustand、サーバー同期のいずれから来るかは知りません。

**悪い例: UI が state 実装に結合している**

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

**良い例: state 管理を Provider に隔離する**

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

同じ `Composer.Input` コンポーネントが両方の Provider で動作します。なぜなら、

実装ではなく context インターフェースにのみ依存しているからです。

### 2.2 依存性注入のための汎用 Context インターフェースを定義する

**影響度: HIGH（ユースケースをまたいだ依存性注入可能な state を実現する）**

コンポーネント context の**汎用インターフェース**を `state`、`actions`、`meta` の

3つのパートで定義します。このインターフェースはどの Provider でも実装できる契約であり、

同じ UI コンポーネントがまったく異なる state 実装で動作することを可能にします。

**核心原則:** state をリフトアップし、内部をコンポーズし、state を

依存性注入可能にする。

**悪い例: UI が特定の state 実装に結合している**

```tsx
function ComposerInput() {
  // 特定のフックに密結合している
  const { input, setInput } = useChannelComposerState()
  return <TextInput value={input} onChangeText={setInput} />
}
```

**良い例: 汎用インターフェースが依存性注入を実現する**

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

重要なのは Provider の境界であり、視覚的なネストではありません。共有 state を

必要とするコンポーネントは `Composer.Frame` の内側にある必要はなく、

Provider の内側にあれば十分です。

`ForwardButton` と `MessagePreview` は視覚的にはコンポーザーボックスの内側に

ありませんが、その state とアクションにアクセスできます。これが state を

Provider にリフトアップすることの力です。

UI は組み合わせて使う再利用可能なパーツです。state は Provider によって依存性注入

されます。Provider を差し替えても、UI はそのまま使えます。

### 2.3 state を Provider コンポーネントにリフトアップする

**影響度: HIGH（コンポーネント境界を超えた state 共有を実現する）**

state 管理を専用の Provider コンポーネントに移動します。これにより、メイン UI の

外側にある兄弟コンポーネントが props のバケツリレーや不自然な ref なしで

state にアクセスし変更できます。

**悪い例: state がコンポーネント内に閉じ込められている**

```tsx
function ForwardMessageComposer() {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()

  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer />
    </Composer.Frame>
  )
}

// 問題: このボタンはどうやってコンポーザーの state にアクセスする？
function ForwardMessageDialog() {
  return (
    <Dialog>
      <ForwardMessageComposer />
      <MessagePreview /> {/* コンポーザーの state が必要 */}
      <DialogActions>
        <CancelButton />
        <ForwardButton /> {/* submit を呼ぶ必要がある */}
      </DialogActions>
    </Dialog>
  )
}
```

**悪い例: useEffect で state を上方に同期する**

```tsx
function ForwardMessageDialog() {
  const [input, setInput] = useState('')
  return (
    <Dialog>
      <ForwardMessageComposer onInputChange={setInput} />
      <MessagePreview input={input} />
    </Dialog>
  )
}

function ForwardMessageComposer({ onInputChange }) {
  const [state, setState] = useState(initialState)
  useEffect(() => {
    onInputChange(state.input) // 変更のたびに同期する
  }, [state.input])
}
```

**悪い例: submit 時に ref から state を読み取る**

```tsx
function ForwardMessageDialog() {
  const stateRef = useRef(null)
  return (
    <Dialog>
      <ForwardMessageComposer stateRef={stateRef} />
      <ForwardButton onPress={() => submit(stateRef.current)} />
    </Dialog>
  )
}
```

**良い例: state を Provider にリフトアップする**

```tsx
function ForwardMessageProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(initialState)
  const forwardMessage = useForwardMessage()
  const inputRef = useRef(null)

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit: forwardMessage }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  )
}

function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        <ForwardMessageComposer />
        <MessagePreview /> {/* カスタムコンポーネントから state とアクションにアクセス可能 */}
        <DialogActions>
          <CancelButton />
          <ForwardButton /> {/* カスタムコンポーネントから state とアクションにアクセス可能 */}
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  )
}

function ForwardButton() {
  const { actions } = use(Composer.Context)
  return <Button onPress={actions.submit}>Forward</Button>
}
```

ForwardButton は Composer.Frame の外側にありますが、Provider の内側にあるため

submit アクションにアクセスできます。一度きりのコンポーネントであっても、

UI 自体の外側からコンポーザーの state とアクションにアクセスできるのです。

**重要なポイント:** 共有 state を必要とするコンポーネントは、視覚的に

互いの内側にネストされている必要はなく、同じ Provider の内側にあれば十分です。

---

## 3. 実装パターン

**影響度: MEDIUM**

コンパウンドコンポーネントと context Provider を実装するための
具体的なテクニックです。

### 3.1 明示的なコンポーネントバリアントを作成する

**影響度: MEDIUM（自己文書化するコード、隠れた条件分岐なし）**

多数の boolean props を持つ1つのコンポーネントではなく、明示的なバリアント

コンポーネントを作成します。各バリアントは必要なパーツを組み合わせます。コードが

自身を文書化します。

**悪い例: 1つのコンポーネント、多数のモード**

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

**良い例: 明示的なバリアント**

```tsx
// 何がレンダリングされるか即座にわかる
<ThreadComposer channelId="abc" />

// または
<EditMessageComposer messageId="xyz" />

// または
<ForwardMessageComposer messageId="123" />
```

各実装はユニークで、明示的で、自己完結しています。それでいて共有パーツを

それぞれ利用できます。

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

### 3.2 render props よりも children によるコンポジションを優先する

**影響度: MEDIUM（よりクリーンなコンポジション、優れた可読性）**

コンポジションには `renderX` props ではなく `children` を使います。children のほうが

可読性が高く、自然にコンポーズでき、コールバックシグネチャの理解を

必要としません。

**悪い例: render props**

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

**良い例: children を使ったコンパウンドコンポーネント**

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

---

## 4. React 19 API

**影響度: MEDIUM**

React 19 以降のみ。`forwardRef` を使わず、`useContext()` の代わりに `use()` を使います。

### 4.1 React 19 API の変更点

**影響度: MEDIUM（よりクリーンなコンポーネント定義と context の使用）**

> **注意: React 19 以降のみ。** React 18 以前を使用している場合はスキップしてください。

React 19 では、`ref` は通常の prop になり（`forwardRef` ラッパーが不要に）、`use()` が `useContext()` に代わります。

**悪い例: React 19 での forwardRef**

```tsx
const ComposerInput = forwardRef<TextInput, Props>((props, ref) => {
  return <TextInput ref={ref} {...props} />
})
```

**良い例: ref を通常の prop として使う**

```tsx
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<TextInput> }) {
  return <TextInput ref={ref} {...props} />
}
```

**悪い例: React 19 での useContext**

```tsx
const value = useContext(MyContext)
```

**良い例: useContext の代わりに use を使う**

```tsx
const value = use(MyContext)
```

`use()` は `useContext()` と異なり、条件付きで呼び出すこともできます。

---

## 参考文献

1. [https://react.dev](https://react.dev)
2. [https://react.dev/learn/passing-data-deeply-with-context](https://react.dev/learn/passing-data-deeply-with-context)
3. [https://react.dev/reference/react/use](https://react.dev/reference/react/use)
