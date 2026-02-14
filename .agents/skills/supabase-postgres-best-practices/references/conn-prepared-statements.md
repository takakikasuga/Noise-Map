---
title: プーリング環境でのプリペアドステートメントの正しい使い方
impact: HIGH
impactDescription: プール環境でのプリペアドステートメント競合を回避
tags: prepared-statements, connection-pooling, transaction-mode
---

## プーリング環境でのプリペアドステートメントの正しい使い方

プリペアドステートメントは個々のデータベース接続に紐づいています。トランザクションモードのプーリングでは接続が共有されるため、競合が発生します。

**誤り（トランザクションプーリングで名前付きプリペアドステートメントを使用）:**

```sql
-- Named prepared statement
prepare get_user as select * from users where id = $1;

-- In transaction mode pooling, next request may get different connection
execute get_user(123);
-- ERROR: prepared statement "get_user" does not exist
```

**正しい（無名ステートメントまたはセッションモードを使用）:**

```sql
-- Option 1: Use unnamed prepared statements (most ORMs do this automatically)
-- The query is prepared and executed in a single protocol message

-- Option 2: Deallocate after use in transaction mode
prepare get_user as select * from users where id = $1;
execute get_user(123);
deallocate get_user;

-- Option 3: Use session mode pooling (port 5432 vs 6543)
-- Connection is held for entire session, prepared statements persist
```

ドライバーの設定を確認してください:

```sql
-- Many drivers use prepared statements by default
-- Node.js pg: { prepare: false } to disable
-- JDBC: prepareThreshold=0 to disable
```

参考文献: [Prepared Statements with Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool-modes)
