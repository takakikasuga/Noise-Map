---
title: 最適な主キー戦略を選択する
impact: HIGH
impactDescription: インデックスの局所性が向上し、フラグメンテーションが減少
tags: primary-key, identity, uuid, serial, schema
---

## 最適な主キー戦略を選択する

主キーの選択は、挿入パフォーマンス、インデックスサイズ、レプリケーション効率に影響します。

**誤り（問題のある主キーの選択）:**

```sql
-- identity is the SQL-standard approach
create table users (
  id serial primary key  -- Works, but IDENTITY is recommended
);

-- Random UUIDs (v4) cause index fragmentation
create table orders (
  id uuid default gen_random_uuid() primary key  -- UUIDv4 = random = scattered inserts
);
```

**正しい（最適な主キー戦略）:**

```sql
-- Use IDENTITY for sequential IDs (SQL-standard, best for most cases)
create table users (
  id bigint generated always as identity primary key
);

-- For distributed systems needing UUIDs, use UUIDv7 (time-ordered)
-- Requires pg_uuidv7 extension: create extension pg_uuidv7;
create table orders (
  id uuid default uuid_generate_v7() primary key  -- Time-ordered, no fragmentation
);

-- Alternative: time-prefixed IDs for sortable, distributed IDs (no extension needed)
create table events (
  id text default concat(
    to_char(now() at time zone 'utc', 'YYYYMMDDHH24MISSMS'),
    gen_random_uuid()::text
  ) primary key
);
```

ガイドライン:

- 単一データベース: `bigint identity`（連番、8バイト、SQL標準）
- 分散/外部公開ID: UUIDv7（pg_uuidv7が必要）またはULID（時間順、フラグメンテーションなし）
- `serial` は動作するが、`identity` がSQL標準であり新規アプリケーションには推奨
- 大規模テーブルではランダムUUID（v4）を主キーにしない（インデックスフラグメンテーションの原因）

参考文献: [Identity Columns](https://www.postgresql.org/docs/current/sql-createtable.html#SQL-CREATETABLE-PARMS-GENERATED-IDENTITY)
