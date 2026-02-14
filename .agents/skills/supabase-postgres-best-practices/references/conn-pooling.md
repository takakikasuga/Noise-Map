---
title: すべてのアプリケーションでコネクションプーリングを使用する
impact: CRITICAL
impactDescription: 同時接続ユーザー数を10〜100倍処理可能に
tags: connection-pooling, pgbouncer, performance, scalability
---

## すべてのアプリケーションでコネクションプーリングを使用する

Postgresの接続は高コスト（各1〜3MB RAM）です。プーリングなしでは、負荷がかかると接続が枯渇します。

**誤り（リクエストごとに新規接続）:**

```sql
-- Each request creates a new connection
-- Application code: db.connect() per request
-- Result: 500 concurrent users = 500 connections = crashed database

-- Check current connections
select count(*) from pg_stat_activity;  -- 487 connections!
```

**正しい（コネクションプーリング）:**

```sql
-- Use a pooler like PgBouncer between app and database
-- Application connects to pooler, pooler reuses a small pool to Postgres

-- Configure pool_size based on: (CPU cores * 2) + spindle_count
-- Example for 4 cores: pool_size = 10

-- Result: 500 concurrent users share 10 actual connections
select count(*) from pg_stat_activity;  -- 10 connections
```

プールモード:

- **トランザクションモード**: 各トランザクション終了後に接続が返却される（ほとんどのアプリに最適）
- **セッションモード**: セッション全体で接続が保持される（プリペアドステートメントや一時テーブルが必要な場合）

参考文献: [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
