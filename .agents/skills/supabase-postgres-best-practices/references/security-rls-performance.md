---
title: RLS ポリシーをパフォーマンス最適化する
impact: HIGH
impactDescription: 適切なパターンで RLS クエリが5〜10倍高速に
tags: rls, performance, security, optimization
---

## RLS ポリシーをパフォーマンス最適化する

不適切に書かれた RLS ポリシーは深刻なパフォーマンス問題を引き起こす可能性があります。サブクエリとインデックスを戦略的に使用してください。

**誤り（関数が各行ごとに呼び出される）:**

```sql
create policy orders_policy on orders
  using (auth.uid() = user_id);  -- auth.uid() called per row!

-- With 1M rows, auth.uid() is called 1M times
```

**正しい（関数を SELECT でラップする）:**

```sql
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);  -- Called once, cached

-- 100x+ faster on large tables
```

複雑なチェックには security definer 関数を使用する:

```sql
-- Create helper function (runs as definer, bypasses RLS)
create or replace function is_team_member(team_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

-- Use in policy (indexed lookup, not per-row check)
create policy team_orders_policy on orders
  using ((select is_team_member(team_id)));
```

RLS ポリシーで使用するカラムには必ずインデックスを追加する:

```sql
create index orders_user_id_idx on orders (user_id);
```

参考文献: [RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
