---
title: 大規模テーブルをパーティショニングしてパフォーマンスを向上させる
impact: MEDIUM-HIGH
impactDescription: 大規模テーブルのクエリとメンテナンスが5〜20倍高速化
tags: partitioning, large-tables, time-series, performance
---

## 大規模テーブルをパーティショニングしてパフォーマンスを向上させる

パーティショニングは大規模テーブルを小さなピースに分割し、クエリパフォーマンスとメンテナンス操作を改善します。

**誤り（単一の大規模テーブル）:**

```sql
create table events (
  id bigint generated always as identity,
  created_at timestamptz,
  data jsonb
);

-- 500M rows, queries scan everything
select * from events where created_at > '2024-01-01';  -- Slow
vacuum events;  -- Takes hours, locks table
```

**正しい（時間範囲によるパーティショニング）:**

```sql
create table events (
  id bigint generated always as identity,
  created_at timestamptz not null,
  data jsonb
) partition by range (created_at);

-- Create partitions for each month
create table events_2024_01 partition of events
  for values from ('2024-01-01') to ('2024-02-01');

create table events_2024_02 partition of events
  for values from ('2024-02-01') to ('2024-03-01');

-- Queries only scan relevant partitions
select * from events where created_at > '2024-01-15';  -- Only scans events_2024_01+

-- Drop old data instantly
drop table events_2023_01;  -- Instant vs DELETE taking hours
```

パーティショニングを検討すべきケース:

- 1億行を超えるテーブル
- 日付ベースのクエリが多い時系列データ
- 古いデータを効率的に削除する必要がある場合

参考文献: [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
