---
title: トランザクションを短く保ちロック競合を減らす
impact: MEDIUM-HIGH
impactDescription: スループットが3〜5倍向上、デッドロック減少
tags: transactions, locking, contention, performance
---

## トランザクションを短く保ちロック競合を減らす

長時間実行されるトランザクションは他のクエリをブロックするロックを保持します。トランザクションはできるだけ短くしましょう。

**誤り（外部呼び出しを含む長いトランザクション）:**

```sql
begin;
select * from orders where id = 1 for update;  -- Lock acquired

-- Application makes HTTP call to payment API (2-5 seconds)
-- Other queries on this row are blocked!

update orders set status = 'paid' where id = 1;
commit;  -- Lock held for entire duration
```

**正しい（最小限のトランザクションスコープ）:**

```sql
-- Validate data and call APIs outside transaction
-- Application: response = await paymentAPI.charge(...)

-- Only hold lock for the actual update
begin;
update orders
set status = 'paid', payment_id = $1
where id = $2 and status = 'pending'
returning *;
commit;  -- Lock held for milliseconds
```

暴走トランザクションを防ぐために `statement_timeout` を使用します:

```sql
-- Abort queries running longer than 30 seconds
set statement_timeout = '30s';

-- Or per-session
set local statement_timeout = '5s';
```

参考文献: [Transaction Management](https://www.postgresql.org/docs/current/tutorial-transactions.html)
