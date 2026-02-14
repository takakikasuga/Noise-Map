---
title: WHEREおよびJOINカラムにインデックスを追加する
impact: CRITICAL
impactDescription: 大規模テーブルでクエリが100〜1000倍高速化
tags: indexes, performance, sequential-scan, query-optimization
---

## WHEREおよびJOINカラムにインデックスを追加する

インデックスのないカラムでフィルタリングやJOINを行うと、テーブルが大きくなるにつれて指数関数的に遅くなるフルテーブルスキャンが発生します。

**誤り（大規模テーブルでのシーケンシャルスキャン）:**

```sql
-- No index on customer_id causes full table scan
select * from orders where customer_id = 123;

-- EXPLAIN shows: Seq Scan on orders (cost=0.00..25000.00 rows=100 width=85)
```

**正しい（インデックススキャン）:**

```sql
-- Create index on frequently filtered column
create index orders_customer_id_idx on orders (customer_id);

select * from orders where customer_id = 123;

-- EXPLAIN shows: Index Scan using orders_customer_id_idx (cost=0.42..8.44 rows=100 width=85)
```

JOINカラムでは、常に外部キー側にインデックスを作成します:

```sql
-- Index the referencing column
create index orders_customer_id_idx on orders (customer_id);

select c.name, o.total
from customers c
join orders o on o.customer_id = c.id;
```

参考文献: [Query Optimization](https://supabase.com/docs/guides/database/query-optimization)
