---
title: VACUUM と ANALYZE でテーブル統計情報を維持する
impact: MEDIUM
impactDescription: 正確な統計情報により2〜10倍優れたクエリプランを実現
tags: vacuum, analyze, statistics, maintenance, autovacuum
---

## VACUUM と ANALYZE でテーブル統計情報を維持する

古い統計情報はクエリプランナーに誤った判断をさせます。VACUUM は空き領域を回収し、ANALYZE は統計情報を更新します。

**誤り（古い統計情報）:**

```sql
-- Table has 1M rows but stats say 1000
-- Query planner chooses wrong strategy
explain select * from orders where status = 'pending';
-- Shows: Seq Scan (because stats show small table)
-- Actually: Index Scan would be much faster
```

**正しい（統計情報を最新に保つ）:**

```sql
-- Manually analyze after large data changes
analyze orders;

-- Analyze specific columns used in WHERE clauses
analyze orders (status, created_at);

-- Check when tables were last analyzed
select
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
from pg_stat_user_tables
order by last_analyze nulls first;
```

高負荷テーブルの autovacuum チューニング:

```sql
-- Increase frequency for high-churn tables
alter table orders set (
  autovacuum_vacuum_scale_factor = 0.05,     -- Vacuum at 5% dead tuples (default 20%)
  autovacuum_analyze_scale_factor = 0.02     -- Analyze at 2% changes (default 10%)
);

-- Check autovacuum status
select * from pg_stat_progress_vacuum;
```

参考文献: [VACUUM](https://supabase.com/docs/guides/database/database-size#vacuum-operations)
