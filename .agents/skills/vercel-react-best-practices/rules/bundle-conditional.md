---
title: 条件付きモジュールローディング
impact: HIGH
impactDescription: 必要な時だけ大きなデータをロード
tags: bundle, conditional-loading, lazy-loading
---

## 条件付きモジュールローディング

大きなデータやモジュールは、機能が有効化された場合にのみロードします。

**例（アニメーションフレームの遅延ロード）：**

```tsx
function AnimationPlayer({ enabled, setEnabled }: { enabled: boolean; setEnabled: React.Dispatch<React.SetStateAction<boolean>> }) {
  const [frames, setFrames] = useState<Frame[] | null>(null)

  useEffect(() => {
    if (enabled && !frames && typeof window !== 'undefined') {
      import('./animation-frames.js')
        .then(mod => setFrames(mod.frames))
        .catch(() => setEnabled(false))
    }
  }, [enabled, frames, setEnabled])

  if (!frames) return <Skeleton />
  return <Canvas frames={frames} />
}
```

`typeof window !== 'undefined'` チェックにより、SSR 用にこのモジュールがバンドルされることを防ぎ、サーバーバンドルサイズとビルド速度を最適化します。
