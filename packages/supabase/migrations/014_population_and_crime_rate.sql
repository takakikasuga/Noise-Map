-- area_vibe_data に total_population カラム追加
ALTER TABLE area_vibe_data ADD COLUMN IF NOT EXISTS total_population INT;

-- town_crimes に crime_rate カラム追加（千人あたり犯罪率）
ALTER TABLE town_crimes ADD COLUMN IF NOT EXISTS crime_rate FLOAT;

-- 駅スコア計算用RPC: 周辺エリアの犯罪率を集約
CREATE OR REPLACE FUNCTION get_station_crime_stats(
  station_lat double precision,
  station_lng double precision,
  radius_m integer DEFAULT 1000,
  target_year integer DEFAULT NULL
)
RETURNS TABLE (
  sum_crimes bigint,
  sum_population bigint,
  area_count bigint
) AS $$
DECLARE
  resolved_year integer;
BEGIN
  IF target_year IS NULL THEN
    SELECT MAX(tc.year) INTO resolved_year FROM town_crimes tc;
  ELSE
    resolved_year := target_year;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(tc.total_crimes), 0)::bigint,
    COALESCE(SUM(avd.total_population), 0)::bigint,
    COUNT(DISTINCT tc.area_name)::bigint
  FROM town_crimes tc
  LEFT JOIN area_vibe_data avd ON avd.area_name = tc.area_name
  WHERE tc.year = resolved_year
    AND tc.lat IS NOT NULL AND tc.lng IS NOT NULL
    AND ST_DWithin(
      ST_Point(tc.lng, tc.lat)::geography,
      ST_Point(station_lng, station_lat)::geography,
      radius_m
    );
END;
$$ LANGUAGE plpgsql STABLE;
