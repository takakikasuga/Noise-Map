-- get_area_geojson: town_crimes.boundary/centroid 削除後の修正
-- areas テーブルの geojson を直接使用、年度も動的化
CREATE OR REPLACE FUNCTION get_area_geojson()
RETURNS TABLE(area_name TEXT, name_en TEXT, score FLOAT, geojson TEXT)
LANGUAGE sql STABLE
AS $$
  SELECT
    tc.area_name,
    a.area_name_en AS name_en,
    tc.score,
    a.geojson
  FROM town_crimes tc
  JOIN areas a ON a.area_name = tc.area_name
  WHERE tc.year = (SELECT MAX(year) FROM town_crimes)
    AND tc.score IS NOT NULL
    AND a.area_name_en IS NOT NULL
    AND a.geojson IS NOT NULL
  ORDER BY tc.score DESC;
$$;
