-- municipality_name でのクエリ高速化（cityページのSSGタイムアウト対策）
-- 既存インデックスは municipality_code のみだが、クエリは municipality_name で絞り込むためフルスキャンが発生していた
CREATE INDEX IF NOT EXISTS idx_town_crimes_municipality_name ON town_crimes(municipality_name);
CREATE INDEX IF NOT EXISTS idx_stations_municipality_name ON stations(municipality_name);
