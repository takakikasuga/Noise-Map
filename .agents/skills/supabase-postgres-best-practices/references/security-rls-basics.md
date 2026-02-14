---
title: マルチテナントデータに行レベルセキュリティを有効にする
impact: CRITICAL
impactDescription: データベースレベルでのテナント分離を強制し、データ漏洩を防止
tags: rls, row-level-security, multi-tenant, security
---

## マルチテナントデータに行レベルセキュリティを有効にする

行レベルセキュリティ（RLS）はデータベースレベルでデータアクセスを制御し、ユーザーが自分のデータのみを参照できることを保証します。

**誤り（アプリケーションレベルのフィルタリングのみ）:**

```sql
-- Relying only on application to filter
select * from orders where user_id = $current_user_id;

-- Bug or bypass means all data is exposed!
select * from orders;  -- Returns ALL orders
```

**正しい（データベースで RLS を強制する）:**

```sql
-- Enable RLS on the table
alter table orders enable row level security;

-- Create policy for users to see only their orders
create policy orders_user_policy on orders
  for all
  using (user_id = current_setting('app.current_user_id')::bigint);

-- Force RLS even for table owners
alter table orders force row level security;

-- Set user context and query
set app.current_user_id = '123';
select * from orders;  -- Only returns orders for user 123
```

認証済みロール向けのポリシー:

```sql
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = auth.uid());
```

参考文献: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
