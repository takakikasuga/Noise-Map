---
title: ちらつきなしでハイドレーションミスマッチを防止する
impact: MEDIUM
impactDescription: 視覚的なちらつきとハイドレーションエラーを回避
tags: rendering, ssr, hydration, localStorage, flicker
---

## ちらつきなしでハイドレーションミスマッチを防止する

クライアントサイドのストレージ（localStorage、Cookie）に依存するコンテンツをレンダリングする場合、React がハイドレートする前に DOM を更新する同期スクリプトを注入することで、SSR の破損とハイドレーション後のちらつきの両方を回避します。

**誤り（SSR が壊れる）：**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  // localStorage はサーバーでは利用できない - エラーをスロー
  const theme = localStorage.getItem('theme') || 'light'

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
```

`localStorage` が undefined のため、サーバーサイドレンダリングが失敗します。

**誤り（視覚的なちらつき）：**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // ハイドレーション後に実行される - 目に見えるフラッシュが発生
    const stored = localStorage.getItem('theme')
    if (stored) {
      setTheme(stored)
    }
  }, [])

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
```

コンポーネントはまずデフォルト値（`light`）でレンダリングし、その後ハイドレーション後に更新されるため、誤ったコンテンツの目に見えるフラッシュが発生します。

**正しい（ちらつきなし、ハイドレーションミスマッチなし）：**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <div id="theme-wrapper">
        {children}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'light';
                var el = document.getElementById('theme-wrapper');
                if (el) el.className = theme;
              } catch (e) {}
            })();
          `,
        }}
      />
    </>
  )
}
```

インラインスクリプトは要素が表示される前に同期的に実行されるため、DOM には既に正しい値が設定されています。ちらつきなし、ハイドレーションミスマッチなしです。

このパターンは、テーマの切り替え、ユーザー設定、認証状態、およびデフォルト値のフラッシュなしにすぐにレンダリングすべきクライアント専用データに特に有効です。
