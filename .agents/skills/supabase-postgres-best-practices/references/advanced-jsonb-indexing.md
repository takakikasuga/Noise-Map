---
title: JSONB カラムにインデックスを作成して効率的にクエリする
impact: MEDIUM
impactDescription: 適切なインデックスで JSONB クエリが10〜100倍高速に
tags: jsonb, gin, indexes, json
---

## JSONB カラムにインデックスを作成して効率的にクエリする

インデックスのない JSONB クエリはテーブル全体をスキャンします。包含クエリには GIN インデックスを使用してください。

**誤り（JSONB にインデックスなし）:**

```sql
create table products (
  id bigint primary key,
  attributes jsonb
);

-- Full table scan for every query
select * from products where attributes @> '{"color": "red"}';
select * from products where attributes->>'brand' = 'Nike';
```

**正しい（JSONB に GIN インデックス）:**

```sql
-- GIN index for containment operators (@>, ?, ?&, ?|)
create index products_attrs_gin on products using gin (attributes);

-- Now containment queries use the index
select * from products where attributes @> '{"color": "red"}';

-- For specific key lookups, use expression index
create index products_brand_idx on products ((attributes->>'brand'));
select * from products where attributes->>'brand' = 'Nike';
```

適切なオペレータークラスの選択:

```sql
-- jsonb_ops (default): supports all operators, larger index
create index idx1 on products using gin (attributes);

-- jsonb_path_ops: only @> operator, but 2-3x smaller index
create index idx2 on products using gin (attributes jsonb_path_ops);
```

参考文献: [JSONB Indexes](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)
