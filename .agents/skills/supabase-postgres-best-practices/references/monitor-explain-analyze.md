---
title: EXPLAIN ANALYZE で遅いクエリを診断する
impact: LOW-MEDIUM
impactDescription: クエリ実行のボトルネックを正確に特定する
tags: explain, analyze, diagnostics, query-plan
---

## EXPLAIN ANALYZE で遅いクエリを診断する

EXPLAIN ANALYZE はクエリを実行し、実際の処理時間を表示することで、真のパフォーマンスボトルネックを明らかにします。

**誤り（パフォーマンス問題を推測する）:**

```sql
-- Query is slow, but why?
select * from orders where customer_id = 123 and status = 'pending';
-- "It must be missing an index" - but which one?
```

**正しい（EXPLAIN ANALYZE を使用する）:**

```sql
explain (analyze, buffers, format text)
select * from orders where customer_id = 123 and status = 'pending';

-- Output reveals the issue:
-- Seq Scan on orders (cost=0.00..25000.00 rows=50 width=100) (actual time=0.015..450.123 rows=50 loops=1)
--   Filter: ((customer_id = 123) AND (status = 'pending'::text))
--   Rows Removed by Filter: 999950
--   Buffers: shared hit=5000 read=15000
-- Planning Time: 0.150 ms
-- Execution Time: 450.500 ms
```

確認すべき重要なポイント:

```sql
-- Seq Scan on large tables = missing index
-- Rows Removed by Filter = poor selectivity or missing index
-- Buffers: read >> hit = data not cached, needs more memory
-- Nested Loop with high loops = consider different join strategy
-- Sort Method: external merge = work_mem too low
```

参考文献: [EXPLAIN](https://supabase.com/docs/guides/database/inspect)
