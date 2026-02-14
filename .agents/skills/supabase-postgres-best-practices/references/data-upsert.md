---
title: INSERT-or-UPDATE操作にはUPSERTを使用する
impact: MEDIUM
impactDescription: アトミック操作でレースコンディションを排除
tags: upsert, on-conflict, insert, update
---

## INSERT-or-UPDATE操作にはUPSERTを使用する

SELECTしてからINSERT/UPDATEを行う方法はレースコンディションを引き起こします。アトミックなUPSERTにはINSERT ... ON CONFLICTを使用しましょう。

**誤り（チェック後にインサートするレースコンディション）:**

```sql
-- Race condition: two requests check simultaneously
select * from settings where user_id = 123 and key = 'theme';
-- Both find nothing

-- Both try to insert
insert into settings (user_id, key, value) values (123, 'theme', 'dark');
-- One succeeds, one fails with duplicate key error!
```

**正しい（アトミックUPSERT）:**

```sql
-- Single atomic operation
insert into settings (user_id, key, value)
values (123, 'theme', 'dark')
on conflict (user_id, key)
do update set value = excluded.value, updated_at = now();

-- Returns the inserted/updated row
insert into settings (user_id, key, value)
values (123, 'theme', 'dark')
on conflict (user_id, key)
do update set value = excluded.value
returning *;
```

INSERT-or-IGNOREパターン:

```sql
-- Insert only if not exists (no update)
insert into page_views (page_id, user_id)
values (1, 123)
on conflict (page_id, user_id) do nothing;
```

参考文献: [INSERT ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)
