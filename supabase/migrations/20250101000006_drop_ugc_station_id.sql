-- UGC をエリア単位に完全統一、station_id を削除
TRUNCATE ugc_posts;

DROP INDEX IF EXISTS idx_ugc_station;

ALTER TABLE ugc_posts DROP COLUMN IF EXISTS station_id;

ALTER TABLE ugc_posts ALTER COLUMN area_name_en SET NOT NULL;
