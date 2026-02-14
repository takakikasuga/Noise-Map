---
title: データに適したインデックスタイプを選択する
impact: HIGH
impactDescription: 適切なインデックスタイプで10〜100倍の改善
tags: indexes, btree, gin, gist, brin, hash, index-types
---

## データに適したインデックスタイプを選択する

インデックスタイプごとに得意なクエリパターンが異なります。デフォルトのB-treeが常に最適とは限りません。

**誤り（JSONB包含演算にB-tree）:**

```sql
-- B-tree cannot optimize containment operators
create index products_attrs_idx on products (attributes);
select * from products where attributes @> '{"color": "red"}';
-- Full table scan - B-tree doesn't support @> operator
```

**正しい（JSONBにはGIN）:**

```sql
-- GIN supports @>, ?, ?&, ?| operators
create index products_attrs_idx on products using gin (attributes);
select * from products where attributes @> '{"color": "red"}';
```

インデックスタイプガイド:

```sql
-- B-tree (default): =, <, >, BETWEEN, IN, IS NULL
create index users_created_idx on users (created_at);

-- GIN: arrays, JSONB, full-text search
create index posts_tags_idx on posts using gin (tags);

-- GiST: geometric data, range types, nearest-neighbor (KNN) queries
create index locations_idx on places using gist (location);

-- BRIN: large time-series tables (10-100x smaller)
create index events_time_idx on events using brin (created_at);

-- Hash: equality-only (slightly faster than B-tree for =)
create index sessions_token_idx on sessions using hash (token);
```

参考文献: [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
