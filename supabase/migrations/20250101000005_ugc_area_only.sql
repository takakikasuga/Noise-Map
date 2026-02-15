-- UGC をエリア（丁目）単位に統一する準備
-- station_id を nullable に変更（エリアUGCでは不要）
ALTER TABLE ugc_posts ALTER COLUMN station_id DROP NOT NULL;

-- area_name_en カラムを追加（存在しない場合）
ALTER TABLE ugc_posts ADD COLUMN IF NOT EXISTS area_name_en TEXT;

-- area_name_en インデックス追加
CREATE INDEX IF NOT EXISTS idx_ugc_area ON ugc_posts (area_name_en) WHERE area_name_en IS NOT NULL;
