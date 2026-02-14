---
title: 一貫したロック順序でデッドロックを防止する
impact: MEDIUM-HIGH
impactDescription: デッドロックエラーの排除、信頼性の向上
tags: deadlocks, locking, transactions, ordering
---

## 一貫したロック順序でデッドロックを防止する

デッドロックは、トランザクションが異なる順序でリソースをロックした場合に発生します。常に一貫した順序でロックを取得しましょう。

**誤り（一貫性のないロック順序）:**

```sql
-- Transaction A                    -- Transaction B
begin;                              begin;
update accounts                     update accounts
set balance = balance - 100         set balance = balance - 50
where id = 1;                       where id = 2;  -- B locks row 2

update accounts                     update accounts
set balance = balance + 100         set balance = balance + 50
where id = 2;  -- A waits for B     where id = 1;  -- B waits for A

-- DEADLOCK! Both waiting for each other
```

**正しい（最初に一貫した順序で行をロック）:**

```sql
-- Explicitly acquire locks in ID order before updating
begin;
select * from accounts where id in (1, 2) order by id for update;

-- Now perform updates in any order - locks already held
update accounts set balance = balance - 100 where id = 1;
update accounts set balance = balance + 100 where id = 2;
commit;
```

代替案: 単一ステートメントでアトミックに更新する:

```sql
-- Single statement acquires all locks atomically
begin;
update accounts
set balance = balance + case id
  when 1 then -100
  when 2 then 100
end
where id in (1, 2);
commit;
```

ログでデッドロックを検出する:

```sql
-- Check for recent deadlocks
select * from pg_stat_database where deadlocks > 0;

-- Enable deadlock logging
set log_lock_waits = on;
set deadlock_timeout = '1s';
```

参考文献:
[Deadlocks](https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS)
