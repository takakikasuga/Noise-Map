---
name: hikkoshi-supabase
description: "ヒッコシマップのSupabaseスキーマ・RLS・クエリパターン。DB関連の実装（マイグレーション作成、クエリ最適化、RLSポリシー、PostGIS空間クエリ）時に使用。"
---

# ヒッコシマップ Supabaseスキル

Supabase（PostgreSQL + PostGIS）関連の実装ガイドライン。

## テーブル構成

```
stations (駅マスタ)
  ├── safety_scores (治安スコア) — station_id FK, 年次データ
  ├── hazard_data (災害リスク) — station_id FK UNIQUE, 1:1
  ├── vibe_data (雰囲気データ) — station_id FK UNIQUE, 1:1
  └── ugc_posts (口コミ) — station_id FK, 1:N
```

すべてのデータテーブルは `stations.id` に FK で紐付く。
`municipality_code` が駅とデータソースを繋ぐリンクキー。

## PostGIS 空間クエリパターン

### 半径検索（駅から1km以内の町丁目を検索）

```sql
SELECT t.town_name, t.crime_count
FROM town_crime_data t
WHERE ST_DWithin(
  t.location::geography,
  (SELECT location FROM stations WHERE id = $1),
  1000  -- メートル単位
);
```

### 最寄り駅検索

```sql
SELECT id, name, ST_Distance(location, ST_Point($1, $2)::geography) AS distance_m
FROM stations
ORDER BY location <-> ST_Point($1, $2)::geography
LIMIT 5;
```

**注意**: `<->` 演算子はGiSTインデックスを使う。`ORDER BY ST_Distance(...)` より高速。

### 座標の挿入

```sql
INSERT INTO stations (name, name_en, location, municipality_code, municipality_name, lines)
VALUES (
  '渋谷',
  'shibuya',
  ST_Point(139.7016, 35.6580)::geography,  -- 経度, 緯度 の順序（注意!）
  '131130',
  '渋谷区',
  ARRAY['JR山手線', '東京メトロ銀座線', '東京メトロ半蔵門線']
);
```

**重要**: PostGISの `ST_Point()` は **経度, 緯度**（lng, lat）の順序。日本のデータソースは緯度,経度の順が多いので変換に注意。

## クエリパターン（Next.js SSG用）

### 駅一覧取得（generateStaticParams用）

```typescript
const { data } = await supabase
  .from('stations')
  .select('name_en')
  .order('name');
// → [{ name_en: 'shibuya' }, { name_en: 'shinjuku' }, ...]
```

### 駅ページデータ取得（1ページ分）

```typescript
const { data: station } = await supabase
  .from('stations')
  .select(`
    *,
    safety_scores!inner(*, station_id),
    hazard_data!inner(*, station_id),
    vibe_data!inner(*, station_id)
  `)
  .eq('name_en', slug)
  .single();
```

JOINは `!inner` を使って確実にデータがある行のみ取得する。

### UGC取得（クライアントサイド）

```typescript
const { data } = await supabase
  .from('ugc_posts')
  .select('*')
  .eq('station_id', stationId)
  .order('created_at', { ascending: false })
  .limit(20);
```

UGCはSSGに含めない（リアルタイム性が必要）。クライアントサイドで取得する。

## RLS（Row Level Security）

### 方針

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| stations | 全員OK | service_role のみ | service_role のみ | service_role のみ |
| safety_scores | 全員OK | service_role のみ | service_role のみ | service_role のみ |
| hazard_data | 全員OK | service_role のみ | service_role のみ | service_role のみ |
| vibe_data | 全員OK | service_role のみ | service_role のみ | service_role のみ |
| ugc_posts | 全員OK | 全員OK | なし | service_role のみ |

### RLS設定SQL

```sql
-- 読み取りは anon key で全員許可
CREATE POLICY "Public read" ON stations FOR SELECT USING (true);

-- 書き込みは service_role key のみ（パイプライン用）
-- service_role はRLSをバイパスするため、明示的なポリシー不要

-- UGCは匿名投稿を許可
CREATE POLICY "Public insert" ON ugc_posts FOR INSERT WITH CHECK (true);
```

### キー使い分け

| 用途 | キー | 環境変数 |
|------|------|---------|
| Next.js（ブラウザ） | anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Next.js（SSG ビルド） | anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Python パイプライン | service_role key | `SUPABASE_SERVICE_ROLE_KEY` |

**絶対にservice_role keyをフロントエンドに露出させないこと。**

## マイグレーション規約

- ファイル名: `NNN_description.sql`（例: `001_initial_schema.sql`）
- 1マイグレーション = 1つの変更（テーブル追加、カラム追加等）
- `IF NOT EXISTS` を必ず付ける（再実行可能にする）
- Supabase Dashboard の SQL Editor で手動実行（CLI連携は不要）

## パフォーマンス注意点

- `stations` テーブルの `location` カラムにはGiSTインデックスが必須
- `safety_scores` は `(station_id, year)` の複合ユニーク制約あり
- SSGビルド時に800駅分のクエリが走る → バッチ取得を検討
- UGCの `created_at DESC` にはインデックスを張る（最新順表示のため）

### SSGビルド時のバッチ取得

800駅分のデータを1駅ずつ取得すると800クエリ発生する。代わりに全駅を一括取得してメモリ上で分配する:

```typescript
// ❌ 非効率（800回のAPI呼び出し）
for (const station of stations) {
  const { data } = await supabase.from('safety_scores').select('*').eq('station_id', station.id);
}

// ✅ 効率的（1回のAPI呼び出し）
const { data: allSafety } = await supabase.from('safety_scores').select('*');
const safetyByStation = Object.groupBy(allSafety, (s) => s.station_id);
```
