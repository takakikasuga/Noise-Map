---
name: web-design-guidelines
description: UI コードを Web Interface Guidelines に準拠しているかレビューします。「UIをレビューして」「アクセシビリティをチェックして」「デザインを監査して」「UXをレビューして」「ベストプラクティスに照らしてサイトをチェックして」などと依頼されたときに使用します。
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

ファイルが Web Interface Guidelines に準拠しているかレビューします。

## 仕組み

1. 以下のソース URL から最新のガイドラインを取得する
2. 指定されたファイルを読み込む（またはユーザーにファイル／パターンの指定を求める）
3. 取得したガイドラインのすべてのルールに照らしてチェックする
4. 簡潔な `file:line` 形式で結果を出力する

## ガイドラインのソース

レビューの前に毎回最新のガイドラインを取得します:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

WebFetch を使用して最新のルールを取得します。取得したコンテンツにはすべてのルールと出力形式の指示が含まれています。

## 使い方

ユーザーがファイルまたはパターンの引数を指定した場合:
1. 上記のソース URL からガイドラインを取得する
2. 指定されたファイルを読み込む
3. 取得したガイドラインのすべてのルールを適用する
4. ガイドラインで指定された形式で結果を出力する

ファイルが指定されていない場合は、レビュー対象のファイルをユーザーに確認します。
