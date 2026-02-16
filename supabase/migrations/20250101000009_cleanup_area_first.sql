-- === テーブル削除 ===
DROP POLICY IF EXISTS "Public read access" ON vibe_data;
DROP TABLE IF EXISTS vibe_data CASCADE;

-- === 不要トリガー・関数削除 ===
DROP TRIGGER IF EXISTS trg_stations_sync_lat_lng ON stations;
DROP FUNCTION IF EXISTS sync_station_lat_lng();

-- === 不要カラム削除 ===
ALTER TABLE stations DROP COLUMN IF EXISTS location;
DROP INDEX IF EXISTS idx_stations_location;
ALTER TABLE town_crimes DROP COLUMN IF EXISTS centroid;
ALTER TABLE town_crimes DROP COLUMN IF EXISTS boundary;
ALTER TABLE town_crimes DROP COLUMN IF EXISTS area_name_raw;
