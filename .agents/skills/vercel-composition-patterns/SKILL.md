---
name: vercel-composition-patterns
description:
  スケールする React コンポジションパターン。boolean props の増殖があるコンポーネントの
  リファクタリング、柔軟なコンポーネントライブラリの構築、再利用可能な API の設計に
  使用します。コンパウンドコンポーネント、render props、context Provider、
  コンポーネントアーキテクチャに関するタスクでトリガーされます。React 19 の
  API 変更も含みます。
license: MIT
metadata:
  author: vercel
  version: '1.0.0'
---

# React コンポジションパターン

柔軟でメンテナンスしやすい React コンポーネントを構築するためのコンポジションパターンです。
コンパウンドコンポーネント、state のリフトアップ、内部のコンポジションを活用して、
boolean props の増殖を防ぎます。これらのパターンにより、コードベースはスケールしても
人間と AI エージェントの両方にとって扱いやすくなります。

## 適用すべきタイミング

以下の場合にこれらのガイドラインを参照してください:

- 多数の boolean props を持つコンポーネントのリファクタリング時
- 再利用可能なコンポーネントライブラリの構築時
- 柔軟なコンポーネント API の設計時
- コンポーネントアーキテクチャのレビュー時
- コンパウンドコンポーネントや context Provider を扱う時

## 優先度別ルールカテゴリ

| 優先度 | カテゴリ                | 影響度 | プレフィックス  |
| ------ | ----------------------- | ------ | --------------- |
| 1      | コンポーネントアーキテクチャ | HIGH   | `architecture-` |
| 2      | state 管理              | MEDIUM | `state-`        |
| 3      | 実装パターン            | MEDIUM | `patterns-`     |
| 4      | React 19 API            | MEDIUM | `react19-`      |

## クイックリファレンス

### 1. コンポーネントアーキテクチャ (HIGH)

- `architecture-avoid-boolean-props` - boolean props で振る舞いをカスタマイズせず、
  コンポジションを使う
- `architecture-compound-components` - 共有 context で複雑なコンポーネントを
  構造化する

### 2. state 管理 (MEDIUM)

- `state-decouple-implementation` - Provider が state の管理方法を知る唯一の場所
- `state-context-interface` - 依存性注入のために state、actions、meta を持つ
  汎用インターフェースを定義する
- `state-lift-state` - 兄弟コンポーネントからのアクセスのために state を Provider
  コンポーネントに移動する

### 3. 実装パターン (MEDIUM)

- `patterns-explicit-variants` - boolean モードの代わりに明示的なバリアント
  コンポーネントを作成する
- `patterns-children-over-render-props` - renderX props の代わりに children で
  コンポジションする

### 4. React 19 API (MEDIUM)

> **注意: React 19 以降のみ。** React 18 以前を使用している場合はこのセクションをスキップしてください。

- `react19-no-forwardref` - `forwardRef` を使わず、`useContext()` の代わりに `use()` を使う

## 使い方

個別のルールファイルを読んで、詳細な説明とコード例を確認してください:

```
rules/architecture-avoid-boolean-props.md
rules/state-context-interface.md
```

各ルールファイルには以下が含まれています:

- なぜ重要なのかの簡潔な説明
- 悪い例のコードと説明
- 良い例のコードと説明
- 追加のコンテキストと参考文献

## 完全版コンパイル済みドキュメント

すべてのルールを展開した完全ガイドはこちら: `AGENTS.md`
