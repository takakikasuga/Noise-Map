---
title: state を Provider コンポーネントにリフトアップする
impact: HIGH
impactDescription: コンポーネント境界を超えた state 共有を実現する
tags: composition, state, context, providers
---

## state を Provider コンポーネントにリフトアップする

state 管理を専用の Provider コンポーネントに移動します。これにより、メイン UI の外側にある兄弟コンポーネントが props のバケツリレーや不自然な ref なしで state にアクセスし変更できます。

**悪い例（state がコンポーネント内に閉じ込められている）:**

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

**悪い例（useEffect で state を上方に同期する）:**

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

**悪い例（submit 時に ref から state を読み取る）:**

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

**良い例（state を Provider にリフトアップする）:**

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

ForwardButton は Composer.Frame の外側にありますが、Provider の内側にあるため submit アクションにアクセスできます。一度きりのコンポーネントであっても、UI 自体の外側からコンポーザーの state とアクションにアクセスできるのです。

**重要なポイント:** 共有 state を必要とするコンポーネントは、視覚的に互いの内側にネストされている必要はなく、同じ Provider の内側にあれば十分です。
