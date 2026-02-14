---
title: フィルタリングクエリに部分インデックスを使用する
impact: HIGH
impactDescription: インデックスサイズが5〜20分の1に縮小し、書き込みとクエリが高速化
tags: indexes, partial-index, query-optimization, storage
---

## フィルタリングクエリに部分インデックスを使用する

部分インデックスはWHERE条件に一致する行のみを含むため、クエリが常に同じ条件でフィルタリングする場合に、より小さく高速なインデックスになります。

**誤り（フルインデックスには不要な行も含まれる）:**

```sql
-- Index includes all rows, even soft-deleted ones
create index users_email_idx on users (email);

-- Query always filters active users
select * from users where email = 'user@example.com' and deleted_at is null;
```

**正しい（部分インデックスがクエリフィルタに一致）:**

```sql
-- Index only includes active users
create index users_active_email_idx on users (email)
where deleted_at is null;

-- Query uses the smaller, faster index
select * from users where email = 'user@example.com' and deleted_at is null;
```

部分インデックスの一般的なユースケース:

```sql
-- Only pending orders (status rarely changes once completed)
create index orders_pending_idx on orders (created_at)
where status = 'pending';

-- Only non-null values
create index products_sku_idx on products (sku)
where sku is not null;
```

参考文献: [Partial Indexes](https://www.postgresql.org/docs/current/indexes-partial.html)
