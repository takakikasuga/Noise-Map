-- PostGIS RPC: 指定座標から半径内の駅を取得
CREATE OR REPLACE FUNCTION get_nearby_stations(
  area_lat double precision,
  area_lng double precision,
  radius_m integer DEFAULT 1000
)
RETURNS TABLE (
  id uuid,
  name text,
  name_en text,
  municipality_name text,
  lat double precision,
  lng double precision
) AS $$
  SELECT
    s.id,
    s.name,
    s.name_en,
    s.municipality_name,
    s.lat,
    s.lng
  FROM stations s
  WHERE s.lat IS NOT NULL
    AND s.lng IS NOT NULL
    AND ST_DWithin(
      ST_Point(s.lng, s.lat)::geography,
      ST_Point(area_lng, area_lat)::geography,
      radius_m
    )
  ORDER BY ST_Distance(
    ST_Point(s.lng, s.lat)::geography,
    ST_Point(area_lng, area_lat)::geography
  )
  LIMIT 5;
$$ LANGUAGE sql STABLE;
