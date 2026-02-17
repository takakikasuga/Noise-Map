-- 既存の無制限INSERTポリシーを削除
DROP POLICY IF EXISTS "Public insert access" ON ugc_posts;
DROP POLICY IF EXISTS "ugc_insert" ON ugc_posts;

-- レート制限付きINSERTポリシー
-- 同一エリアへの投稿は1分間に1件まで
CREATE POLICY "ugc_rate_limited_insert" ON ugc_posts
FOR INSERT WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM ugc_posts AS existing
    WHERE existing.area_name_en = area_name_en
    AND existing.created_at > now() - interval '1 minute'
  )
);
