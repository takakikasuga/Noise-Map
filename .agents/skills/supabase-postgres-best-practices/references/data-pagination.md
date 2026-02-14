---
title: OFFSETの代わりにカーソルベースのページネーションを使用する
impact: MEDIUM-HIGH
impactDescription: ページ深度に関係なく一定のO(1)パフォーマンス
tags: pagination, cursor, keyset, offset, performance
---

## OFFSETの代わりにカーソルベースのページネーションを使用する

OFFSETベースのページネーションはスキップした行をすべてスキャンするため、深いページほど遅くなります。カーソルページネーションはO(1)です。

**誤り（OFFSETページネーション）:**

```sql
-- Page 1: scans 20 rows
select * from products order by id limit 20 offset 0;

-- Page 100: scans 2000 rows to skip 1980
select * from products order by id limit 20 offset 1980;

-- Page 10000: scans 200,000 rows!
select * from products order by id limit 20 offset 199980;
```

**正しい（カーソル/キーセットページネーション）:**

```sql
-- Page 1: get first 20
select * from products order by id limit 20;
-- Application stores last_id = 20

-- Page 2: start after last ID
select * from products where id > 20 order by id limit 20;
-- Uses index, always fast regardless of page depth

-- Page 10000: same speed as page 1
select * from products where id > 199980 order by id limit 20;
```

複数カラムでソートする場合:

```sql
-- Cursor must include all sort columns
select * from products
where (created_at, id) > ('2024-01-15 10:00:00', 12345)
order by created_at, id
limit 20;
```

参考文献: [Pagination](https://supabase.com/docs/guides/database/pagination)
