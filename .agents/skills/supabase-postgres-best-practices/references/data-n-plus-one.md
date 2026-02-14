---
title: バッチ読み込みでN+1クエリを排除する
impact: MEDIUM-HIGH
impactDescription: データベースラウンドトリップを10〜100倍削減
tags: n-plus-one, batch, performance, queries
---

## バッチ読み込みでN+1クエリを排除する

N+1クエリはループ内で各アイテムごとに1つのクエリを実行します。配列やJOINを使って1つのクエリにまとめましょう。

**誤り（N+1クエリ）:**

```sql
-- First query: get all users
select id from users where active = true;  -- Returns 100 IDs

-- Then N queries, one per user
select * from orders where user_id = 1;
select * from orders where user_id = 2;
select * from orders where user_id = 3;
-- ... 97 more queries!

-- Total: 101 round trips to database
```

**正しい（単一バッチクエリ）:**

```sql
-- Collect IDs and query once with ANY
select * from orders where user_id = any(array[1, 2, 3, ...]);

-- Or use JOIN instead of loop
select u.id, u.name, o.*
from users u
left join orders o on o.user_id = u.id
where u.active = true;

-- Total: 1 round trip
```

アプリケーションパターン:

```sql
-- Instead of looping in application code:
-- for user in users: db.query("SELECT * FROM orders WHERE user_id = $1", user.id)

-- Pass array parameter:
select * from orders where user_id = any($1::bigint[]);
-- Application passes: [1, 2, 3, 4, 5, ...]
```

参考文献: [N+1 Query Problem](https://supabase.com/docs/guides/database/query-optimization)
