---
title: pg_stat_statements を有効にしてクエリを分析する
impact: LOW-MEDIUM
impactDescription: リソース消費の多いクエリを特定する
tags: pg-stat-statements, monitoring, statistics, performance
---

## pg_stat_statements を有効にしてクエリを分析する

pg_stat_statements は全クエリの実行統計を追跡し、遅いクエリや頻繁に実行されるクエリの特定を支援します。

**誤り（クエリパターンの可視性がない）:**

```sql
-- Database is slow, but which queries are the problem?
-- No way to know without pg_stat_statements
```

**正しい（pg_stat_statements を有効にしてクエリする）:**

```sql
-- Enable the extension
create extension if not exists pg_stat_statements;

-- Find slowest queries by total time
select
  calls,
  round(total_exec_time::numeric, 2) as total_time_ms,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  query
from pg_stat_statements
order by total_exec_time desc
limit 10;

-- Find most frequent queries
select calls, query
from pg_stat_statements
order by calls desc
limit 10;

-- Reset statistics after optimization
select pg_stat_statements_reset();
```

監視すべき主要メトリクス:

```sql
-- Queries with high mean time (candidates for optimization)
select query, mean_exec_time, calls
from pg_stat_statements
where mean_exec_time > 100  -- > 100ms average
order by mean_exec_time desc;
```

参考文献: [pg_stat_statements](https://supabase.com/docs/guides/database/extensions/pg_stat_statements)
