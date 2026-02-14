-- ヒッコシノイズ 初期スキーマ
-- Supabase Dashboard の SQL Editor で実行する

-- PostGIS 拡張を有効化
CREATE EXTENSION IF NOT EXISTS postgis;

-- 駅マスタ
CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT NOT NULL UNIQUE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  municipality_code TEXT NOT NULL,
  municipality_name TEXT NOT NULL,
  lines TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stations_municipality ON stations(municipality_code);
CREATE INDEX idx_stations_location ON stations USING GIST(location);
CREATE INDEX idx_stations_name_en ON stations(name_en);

-- 治安スコア
CREATE TABLE safety_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT,
  total_crimes INT NOT NULL DEFAULT 0,
  crimes_violent INT NOT NULL DEFAULT 0,
  crimes_assault INT NOT NULL DEFAULT 0,
  crimes_theft INT NOT NULL DEFAULT 0,
  crimes_intellectual INT NOT NULL DEFAULT 0,
  crimes_other INT NOT NULL DEFAULT 0,
  score FLOAT NOT NULL DEFAULT 0,
  rank INT,
  previous_year_total INT,
  data_granularity TEXT NOT NULL DEFAULT 'municipality' CHECK (data_granularity IN ('town', 'municipality')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(station_id, year, month)
);
CREATE INDEX idx_safety_station ON safety_scores(station_id);

-- 災害リスク
CREATE TABLE hazard_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE UNIQUE,
  flood_level TEXT NOT NULL DEFAULT 'none' CHECK (flood_level IN ('none','low','moderate','high','extreme')),
  flood_depth_max FLOAT,
  landslide_warning BOOLEAN NOT NULL DEFAULT false,
  landslide_special BOOLEAN NOT NULL DEFAULT false,
  tsunami_level TEXT NOT NULL DEFAULT 'none' CHECK (tsunami_level IN ('none','low','moderate','high','extreme')),
  tsunami_depth_max FLOAT,
  liquefaction_risk TEXT NOT NULL DEFAULT 'low' CHECK (liquefaction_risk IN ('low','moderate','high')),
  score FLOAT NOT NULL DEFAULT 0,
  rank INT,
  flood_score FLOAT NOT NULL DEFAULT 25,
  landslide_score FLOAT NOT NULL DEFAULT 25,
  tsunami_score FLOAT NOT NULL DEFAULT 25,
  liquefaction_score FLOAT NOT NULL DEFAULT 25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hazard_station ON hazard_data(station_id);

-- 雰囲気データ
CREATE TABLE vibe_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE UNIQUE,
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
CREATE INDEX idx_vibe_station ON vibe_data(station_id);

-- UGC 口コミ
CREATE TABLE ugc_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('safety','noise','community','vibe','other')),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ugc_station ON ugc_posts(station_id);
CREATE INDEX idx_ugc_created ON ugc_posts(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_posts ENABLE ROW LEVEL SECURITY;

-- 全テーブル読み取り許可（公開データ）
CREATE POLICY "Public read access" ON stations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON safety_scores FOR SELECT USING (true);
CREATE POLICY "Public read access" ON hazard_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON vibe_data FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ugc_posts FOR SELECT USING (true);

-- UGC は誰でも投稿可能
CREATE POLICY "Public insert access" ON ugc_posts FOR INSERT WITH CHECK (true);
