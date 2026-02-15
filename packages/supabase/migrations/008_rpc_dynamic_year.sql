-- RPC関数の年度ハードコード（2025）を動的化
-- target_year パラメータを追加し、NULL の場合は MAX(year) を自動取得
CREATE OR REPLACE FUNCTION get_nearby_areas(
  station_lat double precision,
  station_lng double precision,
  radius_m integer DEFAULT 500,
  target_year integer DEFAULT NULL
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
  resolved_year integer;
BEGIN
  -- 最新年を自動解決
  IF target_year IS NULL THEN
    SELECT MAX(tc.year) INTO resolved_year FROM town_crimes tc;
  ELSE
    resolved_year := target_year;
  END IF;

  SELECT count(DISTINCT tc.name_en) INTO result_count
  FROM town_crimes tc
  WHERE tc.year = resolved_year
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
    WHERE tc.year = resolved_year
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
  WHERE tc.year = resolved_year
    AND tc.lat IS NOT NULL AND tc.lng IS NOT NULL
    AND ST_DWithin(
      ST_Point(tc.lng, tc.lat)::geography,
      ST_Point(station_lng, station_lat)::geography,
      current_radius
    )
  ORDER BY tc.name_en, tc.year DESC;
END;
$$ LANGUAGE plpgsql STABLE;
