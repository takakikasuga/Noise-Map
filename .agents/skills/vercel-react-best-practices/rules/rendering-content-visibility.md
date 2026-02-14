---
title: 長いリストに CSS content-visibility を使用する
impact: HIGH
impactDescription: 初期レンダリングの高速化
tags: rendering, css, content-visibility, long-lists
---

## 長いリストに CSS content-visibility を使用する

画面外のレンダリングを遅延させるために `content-visibility: auto` を適用します。

**CSS：**

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

**例：**

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map(msg => (
        <div key={msg.id} className="message-item">
          <Avatar user={msg.author} />
          <div>{msg.content}</div>
        </div>
      ))}
    </div>
  )
}
```

1000件のメッセージの場合、ブラウザは画面外の約990個のアイテムのレイアウト/ペイントをスキップします（初期レンダリングが10倍高速化）。
