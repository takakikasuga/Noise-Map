-- PostGIS RPC: 適応型半径で駅周辺の丁目犯罪データを取得
-- 500m → 1000m → 2000m と自動拡大し、最低10エリアを確保する
-- 都心駅（密集）→ 500-1000m、郊外駅（疎）→ 2000m に自動調整
CREATE OR REPLACE FUNCTION get_nearby_areas(
  station_lat double precision,
  station_lng double precision,
  radius_m integer DEFAULT 500
)
RETURNS TABLE (
  area_name text,
  name_en text,
  municipality_name text,
  total_crimes integer,
  score double precision,
  rank integer,
  lat double precision,
  lng double precision
) AS $$
DECLARE
  result_count integer;
  current_radius integer := radius_m;
  min_results integer := 10;
BEGIN
  SELECT count(DISTINCT tc.name_en) INTO result_count
  FROM town_crimes tc
  WHERE tc.year = 2025
    AND tc.lat IS NOT NULL AND tc.lng IS NOT NULL
    AND ST_DWithin(
      ST_Point(tc.lng, tc.lat)::geography,
      ST_Point(station_lng, station_lat)::geography,
      current_radius
    );

  IF result_count < min_results AND current_radius < 1000 THEN
    current_radius := 1000;
    SELECT count(DISTINCT tc.name_en) INTO result_count
    FROM town_crimes tc
    WHERE tc.year = 2025
      AND tc.lat IS NOT NULL AND tc.lng IS NOT NULL
      AND ST_DWithin(
        ST_Point(tc.lng, tc.lat)::geography,
        ST_Point(station_lng, station_lat)::geography,
        current_radius
      );
  END IF;

  IF result_count < min_results AND current_radius < 2000 THEN
    current_radius := 2000;
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (tc.name_en)
    tc.area_name,
    tc.name_en,
    tc.municipality_name,
    tc.total_crimes,
    tc.score,
    tc.rank,
    tc.lat,
    tc.lng
  FROM town_crimes tc
  WHERE tc.year = 2025
    AND tc.lat IS NOT NULL AND tc.lng IS NOT NULL
    AND ST_DWithin(
      ST_Point(tc.lng, tc.lat)::geography,
      ST_Point(station_lng, station_lat)::geography,
      current_radius
    )
  ORDER BY tc.name_en, tc.year DESC;
END;
$$ LANGUAGE plpgsql STABLE;
