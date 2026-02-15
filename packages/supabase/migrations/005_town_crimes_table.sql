-- town_crimes テーブル定義（パイプラインで暗黙的に作成されていたものを正式にマイグレーション管理）
CREATE TABLE IF NOT EXISTS town_crimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name TEXT NOT NULL,
  area_name_raw TEXT,
  name_en TEXT,
  municipality_code TEXT NOT NULL,
  municipality_name TEXT NOT NULL,
  year INT NOT NULL,
  total_crimes INT NOT NULL DEFAULT 0,
  crimes_violent INT NOT NULL DEFAULT 0,
  crimes_assault INT NOT NULL DEFAULT 0,
  crimes_theft INT NOT NULL DEFAULT 0,
  crimes_intellectual INT NOT NULL DEFAULT 0,
  crimes_other INT NOT NULL DEFAULT 0,
  score FLOAT,
  rank INT,
  centroid TEXT,
  boundary TEXT,
  lat FLOAT,
  lng FLOAT,
  geojson TEXT,
  UNIQUE(area_name, year)
);

CREATE INDEX IF NOT EXISTS idx_town_crimes_name_en ON town_crimes(name_en);
CREATE INDEX IF NOT EXISTS idx_town_crimes_municipality ON town_crimes(municipality_code);
CREATE INDEX IF NOT EXISTS idx_town_crimes_year_score ON town_crimes(year, score);

-- RLS
ALTER TABLE town_crimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON town_crimes FOR SELECT USING (true);
