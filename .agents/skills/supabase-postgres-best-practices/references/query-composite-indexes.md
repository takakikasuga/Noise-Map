---
title: 複数カラムクエリ向けの複合インデックスを作成する
impact: HIGH
impactDescription: 複数カラムクエリが5〜10倍高速化
tags: indexes, composite-index, multi-column, query-optimization
---

## 複数カラムクエリ向けの複合インデックスを作成する

複数カラムでフィルタリングするクエリでは、個別の単一カラムインデックスよりも複合インデックスの方が効率的です。

**誤り（個別インデックスではビットマップスキャンが必要）:**

```sql
-- Two separate indexes
create index orders_status_idx on orders (status);
create index orders_created_idx on orders (created_at);

-- Query must combine both indexes (slower)
select * from orders where status = 'pending' and created_at > '2024-01-01';
```

**正しい（複合インデックス）:**

```sql
-- Single composite index (leftmost column first for equality checks)
create index orders_status_created_idx on orders (status, created_at);

-- Query uses one efficient index scan
select * from orders where status = 'pending' and created_at > '2024-01-01';
```

**カラムの順序が重要** — 等値条件のカラムを先に、範囲条件のカラムを後に配置します:

```sql
-- Good: status (=) before created_at (>)
create index idx on orders (status, created_at);

-- Works for: WHERE status = 'pending'
-- Works for: WHERE status = 'pending' AND created_at > '2024-01-01'
-- Does NOT work for: WHERE created_at > '2024-01-01' (leftmost prefix rule)
```

参考文献: [Multicolumn Indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)
