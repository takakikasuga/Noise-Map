---
name: supabase-postgres-best-practices
description: Supabase による Postgres パフォーマンス最適化とベストプラクティス。Postgres クエリの作成・レビュー・最適化、スキーマ設計、データベース設定を行う際にこのスキルを使用してください。
license: MIT
metadata:
  author: supabase
  version: "1.1.0"
  organization: Supabase
  date: January 2026
  abstract: Supabase と Postgres を使用する開発者向けの包括的な Postgres パフォーマンス最適化ガイド。8カテゴリにわたるパフォーマンスルールを含み、クリティカル（クエリパフォーマンス、コネクション管理）からインクリメンタル（高度な機能）まで影響度順に優先度付けされています。各ルールには詳細な説明、誤りと正しい SQL 例、クエリプラン分析、具体的なパフォーマンス指標が含まれており、自動最適化とコード生成をガイドします。
---

# Supabase Postgres ベストプラクティス

Supabase が管理する Postgres の包括的パフォーマンス最適化ガイド。8カテゴリにわたるルールを含み、自動クエリ最適化とスキーマ設計をガイドするために影響度順に優先度付けされています。

## 適用するタイミング

以下の場面でこれらのガイドラインを参照してください:
- SQL クエリの作成やスキーマ設計時
- インデックスの実装やクエリ最適化時
- データベースパフォーマンスの問題をレビューする際
- コネクションプーリングやスケーリングの設定時
- Postgres 固有の機能を最適化する際
- Row-Level Security (RLS) を扱う際

## ルールカテゴリ（優先度順）

| 優先度 | カテゴリ | 影響度 | プレフィックス |
|--------|----------|--------|----------------|
| 1 | クエリパフォーマンス | クリティカル | `query-` |
| 2 | コネクション管理 | クリティカル | `conn-` |
| 3 | セキュリティ & RLS | クリティカル | `security-` |
| 4 | スキーマ設計 | 高 | `schema-` |
| 5 | 同時実行 & ロック | 中〜高 | `lock-` |
| 6 | データアクセスパターン | 中 | `data-` |
| 7 | モニタリング & 診断 | 低〜中 | `monitor-` |
| 8 | 高度な機能 | 低 | `advanced-` |

## 使い方

個別のルールファイルを読んで、詳細な説明と SQL 例を確認してください:

```
references/query-missing-indexes.md
references/schema-partial-indexes.md
references/_sections.md
```

各ルールファイルの内容:
- なぜ重要かの簡潔な説明
- 誤った SQL 例とその解説
- 正しい SQL 例とその解説
- オプションの EXPLAIN 出力やメトリクス
- 追加のコンテキストと参考資料
- Supabase 固有の注意事項（該当する場合）

## 参考資料

- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/auth/row-level-security
