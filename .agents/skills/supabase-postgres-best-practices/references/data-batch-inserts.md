---
title: 大量データにはバッチINSERTを使用する
impact: MEDIUM
impactDescription: バルクインサートが10〜50倍高速化
tags: batch, insert, bulk, performance, copy
---

## 大量データにはバッチINSERTを使用する

個別のINSERT文はオーバーヘッドが大きいです。複数行を1つのステートメントにまとめるか、COPYを使用しましょう。

**誤り（個別インサート）:**

```sql
-- Each insert is a separate transaction and round trip
insert into events (user_id, action) values (1, 'click');
insert into events (user_id, action) values (1, 'view');
insert into events (user_id, action) values (2, 'click');
-- ... 1000 more individual inserts

-- 1000 inserts = 1000 round trips = slow
```

**正しい（バッチインサート）:**

```sql
-- Multiple rows in single statement
insert into events (user_id, action) values
  (1, 'click'),
  (1, 'view'),
  (2, 'click'),
  -- ... up to ~1000 rows per batch
  (999, 'view');

-- One round trip for 1000 rows
```

大量インポートにはCOPYを使用します:

```sql
-- COPY is fastest for bulk loading
copy events (user_id, action, created_at)
from '/path/to/data.csv'
with (format csv, header true);

-- Or from stdin in application
copy events (user_id, action) from stdin with (format csv);
1,click
1,view
2,click
\.
```

参考文献: [COPY](https://www.postgresql.org/docs/current/sql-copy.html)
