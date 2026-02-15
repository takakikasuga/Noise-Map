-- ===== 丁目マスタテーブル =====
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name TEXT NOT NULL UNIQUE,          -- 正規化済み丁目名（例: "千代田区飯田橋1丁目"）
  area_name_en TEXT,                       -- URL スラッグ
  municipality_code TEXT NOT NULL,         -- 5桁市区町村コード
  municipality_name TEXT NOT NULL,
  key_code TEXT,                           -- Shapefile 11桁コード（e-Stat マッピング用）
  lat FLOAT,
  lng FLOAT,
  centroid TEXT,                           -- WKT POINT
  boundary TEXT,                           -- WKT MultiPolygon
  geojson TEXT,                            -- GeoJSON（フロントエンド用）
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_areas_municipality ON areas(municipality_code);
CREATE INDEX idx_areas_name_en ON areas(area_name_en);
CREATE INDEX idx_areas_key_code ON areas(key_code);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas_public_read" ON areas FOR SELECT USING (true);

-- ===== エリア Vibe データテーブル =====
CREATE TABLE area_vibe_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name TEXT NOT NULL REFERENCES areas(area_name) ON DELETE CASCADE UNIQUE,
  population_young_ratio FLOAT,
  population_family_ratio FLOAT,
  population_elderly_ratio FLOAT,
  daytime_population_ratio FLOAT,
  single_household_ratio FLOAT,
  restaurant_count INT DEFAULT 0,
  convenience_store_count INT DEFAULT 0,
  park_count INT DEFAULT 0,
  school_count INT DEFAULT 0,
  hospital_count INT DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_area_vibe_name ON area_vibe_data(area_name);

ALTER TABLE area_vibe_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "area_vibe_public_read" ON area_vibe_data FOR SELECT USING (true);
