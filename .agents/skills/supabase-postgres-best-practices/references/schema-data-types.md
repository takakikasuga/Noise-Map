---
title: 適切なデータ型を選択する
impact: HIGH
impactDescription: ストレージが50%削減され、比較処理が高速化
tags: data-types, schema, storage, performance
---

## 適切なデータ型を選択する

適切なデータ型を使用することで、ストレージの削減、クエリパフォーマンスの向上、バグの防止が可能です。

**誤り（不適切なデータ型）:**

```sql
create table users (
  id int,                    -- Will overflow at 2.1 billion
  email varchar(255),        -- Unnecessary length limit
  created_at timestamp,      -- Missing timezone info
  is_active varchar(5),      -- String for boolean
  price varchar(20)          -- String for numeric
);
```

**正しい（適切なデータ型）:**

```sql
create table users (
  id bigint generated always as identity primary key,  -- 9 quintillion max
  email text,                     -- No artificial limit, same performance as varchar
  created_at timestamptz,         -- Always store timezone-aware timestamps
  is_active boolean default true, -- 1 byte vs variable string length
  price numeric(10,2)             -- Exact decimal arithmetic
);
```

主なガイドライン:

```sql
-- IDs: use bigint, not int (future-proofing)
-- Strings: use text, not varchar(n) unless constraint needed
-- Time: use timestamptz, not timestamp
-- Money: use numeric, not float (precision matters)
-- Enums: use text with check constraint or create enum type
```

参考文献: [Data Types](https://www.postgresql.org/docs/current/datatype.html)
