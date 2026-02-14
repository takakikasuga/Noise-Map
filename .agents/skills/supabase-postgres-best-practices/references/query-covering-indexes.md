---
title: カバリングインデックスでテーブルルックアップを回避する
impact: MEDIUM-HIGH
impactDescription: ヒープフェッチを排除しクエリが2〜5倍高速化
tags: indexes, covering-index, include, index-only-scan
---

## カバリングインデックスでテーブルルックアップを回避する

カバリングインデックスはクエリに必要なすべてのカラムを含み、テーブルへのアクセスを完全にスキップするインデックスオンリースキャンを可能にします。

**誤り（インデックススキャン + ヒープフェッチ）:**

```sql
create index users_email_idx on users (email);

-- Must fetch name and created_at from table heap
select email, name, created_at from users where email = 'user@example.com';
```

**正しい（INCLUDEによるインデックスオンリースキャン）:**

```sql
-- Include non-searchable columns in the index
create index users_email_idx on users (email) include (name, created_at);

-- All columns served from index, no table access needed
select email, name, created_at from users where email = 'user@example.com';
```

SELECTするがフィルタリングには使わないカラムにはINCLUDEを使用します:

```sql
-- Searching by status, but also need customer_id and total
create index orders_status_idx on orders (status) include (customer_id, total);

select status, customer_id, total from orders where status = 'shipped';
```

参考文献: [Index-Only Scans](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)
