---
title: 互換性のために小文字の識別子を使用する
impact: MEDIUM
impactDescription: ツール・ORM・AIアシスタントとの大文字小文字の不整合バグを回避
tags: naming, identifiers, case-sensitivity, schema, conventions
---

## 互換性のために小文字の識別子を使用する

PostgreSQLは引用符なしの識別子を小文字に変換します。引用符付きの大文字小文字混在の識別子は永続的に引用符が必要となり、ツール・ORM・AIアシスタントが認識できない問題を引き起こします。

**誤り（大文字小文字混在の識別子）:**

```sql
-- Quoted identifiers preserve case but require quotes everywhere
CREATE TABLE "Users" (
  "userId" bigint PRIMARY KEY,
  "firstName" text,
  "lastName" text
);

-- Must always quote or queries fail
SELECT "firstName" FROM "Users" WHERE "userId" = 1;

-- This fails - Users becomes users without quotes
SELECT firstName FROM Users;
-- ERROR: relation "users" does not exist
```

**正しい（小文字のsnake_case）:**

```sql
-- Unquoted lowercase identifiers are portable and tool-friendly
CREATE TABLE users (
  user_id bigint PRIMARY KEY,
  first_name text,
  last_name text
);

-- Works without quotes, recognized by all tools
SELECT first_name FROM users WHERE user_id = 1;
```

大文字小文字混在の識別子が生じる一般的な原因:

```sql
-- ORMs often generate quoted camelCase - configure them to use snake_case
-- Migrations from other databases may preserve original casing
-- Some GUI tools quote identifiers by default - disable this

-- If stuck with mixed-case, create views as a compatibility layer
CREATE VIEW users AS SELECT "userId" AS user_id, "firstName" AS first_name FROM "Users";
```

参考文献: [Identifiers and Key Words](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
