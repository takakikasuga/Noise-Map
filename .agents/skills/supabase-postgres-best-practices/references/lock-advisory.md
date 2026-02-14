---
title: アプリケーションレベルのロックにはアドバイザリーロックを使用する
impact: MEDIUM
impactDescription: 行レベルロックのオーバーヘッドなしに効率的な協調処理
tags: advisory-locks, coordination, application-locks
---

## アプリケーションレベルのロックにはアドバイザリーロックを使用する

アドバイザリーロックは、ロック対象のデータベース行を必要とせずにアプリケーションレベルの協調処理を提供します。

**誤り（ロックのためだけに行を作成する）:**

```sql
-- Creating dummy rows to lock on
create table resource_locks (
  resource_name text primary key
);

insert into resource_locks values ('report_generator');

-- Lock by selecting the row
select * from resource_locks where resource_name = 'report_generator' for update;
```

**正しい（アドバイザリーロック）:**

```sql
-- Session-level advisory lock (released on disconnect or unlock)
select pg_advisory_lock(hashtext('report_generator'));
-- ... do exclusive work ...
select pg_advisory_unlock(hashtext('report_generator'));

-- Transaction-level lock (released on commit/rollback)
begin;
select pg_advisory_xact_lock(hashtext('daily_report'));
-- ... do work ...
commit;  -- Lock automatically released
```

ノンブロッキング操作のためのトライロック:

```sql
-- Returns immediately with true/false instead of waiting
select pg_try_advisory_lock(hashtext('resource_name'));

-- Use in application
if (acquired) {
  -- Do work
  select pg_advisory_unlock(hashtext('resource_name'));
} else {
  -- Skip or retry later
}
```

参考文献: [Advisory Locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
