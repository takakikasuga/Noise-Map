-- safety_scores: 駅×年の複合インデックス（頻出クエリパターン）
CREATE INDEX IF NOT EXISTS idx_safety_station_year
  ON safety_scores(station_id, year DESC);

-- area_vibe_data: エリア名インデックス（エリアページ表示用）
-- 009_areas_master.sql で idx_area_vibe_name が作成済みだが、
-- 万が一未適用の環境向けに別名で追加
CREATE INDEX IF NOT EXISTS idx_area_vibe_area_name
  ON area_vibe_data(area_name);

-- town_crimes: エリア名×年の複合インデックス（GeoJSON API用）
CREATE INDEX IF NOT EXISTS idx_town_crimes_area_year
  ON town_crimes(area_name, year DESC);
