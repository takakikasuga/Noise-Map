-- 013: vibe データ品質レベルカラム追加
-- area_vibe_data に data_source_level を追加し、人口データの粒度を記録する

ALTER TABLE area_vibe_data
  ADD COLUMN IF NOT EXISTS data_source_level TEXT DEFAULT 'small_area'
  CHECK (data_source_level IN ('small_area', 'municipality', 'no_population'));

COMMENT ON COLUMN area_vibe_data.data_source_level IS
  'データソースの粒度。small_area=小地域, municipality=市区町村フォールバック, no_population=人口データなし';

COMMENT ON COLUMN area_vibe_data.daytime_population_ratio IS
  '昼夜間人口比率。常に市区町村レベルの値（小地域データなし）';

-- 既存データの data_source_level を設定
-- 人口比率がすべて 0 のレコードは人口データなしと判定
UPDATE area_vibe_data SET data_source_level = 'no_population'
WHERE population_young_ratio = 0
  AND population_family_ratio = 0
  AND population_elderly_ratio = 0;
