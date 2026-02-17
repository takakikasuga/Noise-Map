import { cache } from 'react';
import { createSupabaseClient } from '@hikkoshimap/supabase';

/** snake_case キーを camelCase に変換 */
function snakeToCamel<T extends Record<string, unknown>>(
  obj: T,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

/** 配列の各要素を camelCase に変換 */
function snakeToCamelArray<T extends Record<string, unknown>>(
  arr: T[],
): Record<string, unknown>[] {
  return arr.map(snakeToCamel);
}

/**
 * DB 内の最新年を取得（ビルド時に1回だけ実行、React cache で重複排除）
 */
export const getLatestYear = cache(async function getLatestYear(): Promise<number> {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from('safety_scores')
    .select('year')
    .order('year', { ascending: false })
    .limit(1)
    .single();
  return data?.year ?? 2025;
});

/**
 * DB 内の年度範囲を取得（方法論ページ等で使用）
 */
export const getYearRange = cache(async function getYearRange() {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from('safety_scores')
    .select('year')
    .order('year', { ascending: true })
    .limit(1)
    .single();
  const minYear = data?.year ?? 2017;
  const maxYear = await getLatestYear();
  return { minYear, maxYear, count: maxYear - minYear + 1 };
});

/**
 * 全駅を取得（generateStaticParams 用）
 */
export async function getAllStations() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('stations')
    .select('id, name, name_en, municipality_name, lines')
    .order('name');

  if (error) throw error;
  return snakeToCamelArray(data ?? []);
}

/**
 * スラッグ（name_en）で駅を1件取得
 */
export const getStationBySlug = cache(async function getStationBySlug(slug: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('stations')
    .select('*')
    .eq('name_en', slug)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return snakeToCamel(data);
});

/**
 * 駅の治安スコアを取得（複数年分）
 */
export async function getStationSafety(stationId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('safety_scores')
    .select('*')
    .eq('station_id', stationId)
    .order('year', { ascending: false });

  if (error) throw error;
  return snakeToCamelArray(data ?? []);
}


/**
 * エリア（丁目）の雰囲気データを取得
 */
export async function getAreaVibe(areaName: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('area_vibe_data')
    .select('*')
    .eq('area_name', areaName)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return snakeToCamel(data);
}

/**
 * 駅の災害リスクデータを取得
 */
export async function getStationHazard(stationId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('hazard_data')
    .select('*')
    .eq('station_id', stationId)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return snakeToCamel(data);
}

/**
 * 全駅の座標付きリスト（トップページ俯瞰マップ用）
 */
export async function getStationListForMap() {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('stations')
    .select('name, name_en, lat, lng, safety_scores(score)')
    .eq('safety_scores.year', year)
    .order('name');

  if (error) throw error;
  return (data ?? []).map((row) => ({
    name: row.name,
    nameEn: row.name_en,
    lat: row.lat,
    lng: row.lng,
    score: (row.safety_scores as unknown as { score: number }[])?.[0]?.score ?? null,
  }));
}

/**
 * 検索オートコンプリート用の軽量駅リスト
 */
export async function getStationListForSearch() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('stations')
    .select('name, name_en')
    .order('name');

  if (error) throw error;
  return snakeToCamelArray(data ?? []);
}


/**
 * 治安スコア上位のエリアを取得（最新年）
 */
export async function getTopAreas(limit: number = 5) {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en, score')
    .eq('year', year)
    .not('score', 'is', null)
    .not('name_en', 'is', null)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    areaName: row.area_name,
    nameEn: row.name_en,
    score: row.score,
  }));
}

/**
 * 治安スコア下位のエリアを取得（最新年）
 */
export async function getBottomAreas(limit: number = 5) {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en, score')
    .eq('year', year)
    .not('score', 'is', null)
    .not('name_en', 'is', null)
    .order('score', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    areaName: row.area_name,
    nameEn: row.name_en,
    score: row.score,
  }));
}

/**
 * 最新の口コミを取得（トップページ用）
 */
export async function getRecentUgcPosts(limit: number = 5) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('ugc_posts')
    .select('id, content, category, rating, created_at, area_name_en')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = data ?? [];

  // エリア投稿の日本語名を一括取得
  const areaSlugs = rows
    .map((r) => r.area_name_en)
    .filter((v): v is string => v != null);

  let areaNameMap: Record<string, string> = {};
  if (areaSlugs.length > 0) {
    const { data: areaData } = await supabase
      .from('town_crimes')
      .select('name_en, area_name')
      .in('name_en', areaSlugs)
      .eq('year', await getLatestYear());
    for (const a of areaData ?? []) {
      areaNameMap[a.name_en as string] = a.area_name as string;
    }
  }

  return rows.map((row) => {
    const areaEn = row.area_name_en as string | null;
    return {
      id: row.id,
      content: row.content,
      category: row.category,
      rating: row.rating as number | null,
      createdAt: row.created_at,
      areaNameEn: areaEn,
      areaName: areaEn ? (areaNameMap[areaEn] ?? null) : null,
    };
  });
}

/**
 * 全エリアを取得（generateStaticParams 用）
 */
export async function getAllAreas() {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('name_en')
    .eq('year', year)
    .not('name_en', 'is', null)
    .order('name_en');

  if (error) throw error;

  // DISTINCT: name_en で重複を排除
  const seen = new Set<string>();
  const unique = (data ?? []).filter((d) => {
    if (seen.has(d.name_en)) return false;
    seen.add(d.name_en);
    return true;
  });
  return snakeToCamelArray(unique);
}

/**
 * スラッグ（name_en）でエリアを1件取得（最新年）
 */
export const getAreaBySlug = cache(async function getAreaBySlug(slug: string) {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('*')
    .eq('name_en', slug)
    .eq('year', year)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  return snakeToCamel(data);
});

/**
 * エリアの治安データを取得（複数年分）
 */
export async function getAreaSafety(nameEn: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('*')
    .eq('name_en', nameEn)
    .order('year', { ascending: false });

  if (error) throw error;

  const sorted = snakeToCamelArray(data ?? []);

  // previousYearTotal を計算（前年の totalCrimes）
  return sorted.map((d, i) => ({
    ...d,
    previousYearTotal:
      i < sorted.length - 1
        ? (sorted[i + 1] as { totalCrimes: number }).totalCrimes
        : null,
  }));
}

/**
 * 検索オートコンプリート用のエリアリスト
 */
export async function getAreaListForSearch() {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en')
    .eq('year', year)
    .not('name_en', 'is', null)
    .order('area_name');

  if (error) throw error;
  return snakeToCamelArray(data ?? []);
}

/**
 * 市区町村内の駅一覧（治安スコア付き）
 */
export async function getStationsByMunicipality(municipalityName: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('stations')
    .select('id, name, name_en, lat, lng, lines, municipality_name')
    .eq('municipality_name', municipalityName)
    .order('name');

  if (error) throw error;

  const stations = snakeToCamelArray(data ?? []);

  // 各駅の最新治安スコアを取得
  const stationIds = (data ?? []).map((s) => s.id);
  if (stationIds.length === 0) return [];

  const { data: scores, error: scoresError } = await supabase
    .from('safety_scores')
    .select('station_id, score, rank')
    .in('station_id', stationIds)
    .eq('year', await getLatestYear());

  if (scoresError) throw scoresError;

  const scoreMap = new Map<string, { score: number; rank: number | null }>();
  for (const s of scores ?? []) {
    scoreMap.set(s.station_id, { score: s.score, rank: s.rank });
  }

  return stations.map((s) => ({
    ...s,
    safetyScore: scoreMap.get(s.id as string)?.score ?? null,
    safetyRank: scoreMap.get(s.id as string)?.rank ?? null,
  }));
}

/**
 * 市区町村内のエリア一覧（最新年、スコア順）
 */
export async function getAreasByMunicipality(municipalityName: string) {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en, score, rank, total_crimes')
    .eq('municipality_name', municipalityName)
    .eq('year', year)
    .not('name_en', 'is', null)
    .order('score', { ascending: false });

  if (error) throw error;
  return snakeToCamelArray(data ?? []);
}

/**
 * 市区町村の犯罪統計集計（年別）
 */
export async function getMunicipalityCrimeStats(municipalityName: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('year, total_crimes, crimes_violent, crimes_assault, crimes_theft, crimes_intellectual, crimes_other')
    .eq('municipality_name', municipalityName);

  if (error) throw error;

  // 年ごとに集計
  const byYear = new Map<number, {
    year: number;
    totalCrimes: number;
    crimesViolent: number;
    crimesAssault: number;
    crimesTheft: number;
    crimesIntellectual: number;
    crimesOther: number;
  }>();

  for (const row of data ?? []) {
    const year = row.year;
    const existing = byYear.get(year) ?? {
      year,
      totalCrimes: 0,
      crimesViolent: 0,
      crimesAssault: 0,
      crimesTheft: 0,
      crimesIntellectual: 0,
      crimesOther: 0,
    };
    existing.totalCrimes += row.total_crimes ?? 0;
    existing.crimesViolent += row.crimes_violent ?? 0;
    existing.crimesAssault += row.crimes_assault ?? 0;
    existing.crimesTheft += row.crimes_theft ?? 0;
    existing.crimesIntellectual += row.crimes_intellectual ?? 0;
    existing.crimesOther += row.crimes_other ?? 0;
    byYear.set(year, existing);
  }

  const sorted = [...byYear.values()].sort((a, b) => b.year - a.year);

  // previousYearTotal を計算
  return sorted.map((d, i) => ({
    ...d,
    previousYearTotal: i < sorted.length - 1 ? sorted[i + 1].totalCrimes : null,
  }));
}

/**
 * 全路線の一覧を取得（stationsテーブルの lines カラムから distinct）
 * 各路線の駅数と平均治安スコアを含む
 */
export async function getLinesList() {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();

  const { data, error } = await supabase
    .from('stations')
    .select('id, lines');

  if (error) throw error;

  // lines は string[] なので、展開して駅IDとの対応を作る
  const lineStationMap = new Map<string, string[]>();
  for (const row of data ?? []) {
    const lines = (row.lines as string[]) ?? [];
    for (const line of lines) {
      const existing = lineStationMap.get(line) ?? [];
      existing.push(row.id);
      lineStationMap.set(line, existing);
    }
  }

  // 各路線の駅IDリストから治安スコアを取得
  const allStationIds = [...new Set((data ?? []).map((r) => r.id))];
  const { data: scores, error: scoresError } = await supabase
    .from('safety_scores')
    .select('station_id, score')
    .in('station_id', allStationIds)
    .eq('year', year);

  if (scoresError) throw scoresError;

  const scoreMap = new Map<string, number>();
  for (const s of scores ?? []) {
    scoreMap.set(s.station_id, s.score);
  }

  const lines: { name: string; stationCount: number; avgScore: number | null }[] = [];
  for (const [lineName, stationIds] of lineStationMap) {
    const lineScores = stationIds
      .map((id) => scoreMap.get(id))
      .filter((s): s is number => s != null);
    const avgScore = lineScores.length > 0
      ? Math.round((lineScores.reduce((a, b) => a + b, 0) / lineScores.length) * 10) / 10
      : null;
    lines.push({ name: lineName, stationCount: stationIds.length, avgScore });
  }

  return lines.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/**
 * 特定路線の駅一覧を取得（治安スコア付き）
 */
export async function getStationsByLine(lineName: string) {
  const supabase = createSupabaseClient();
  const year = await getLatestYear();

  const { data, error } = await supabase
    .from('stations')
    .select('id, name, name_en, lat, lng, lines, municipality_name')
    .contains('lines', [lineName])
    .order('name');

  if (error) throw error;

  const stations = snakeToCamelArray(data ?? []);

  const stationIds = (data ?? []).map((s) => s.id);
  if (stationIds.length === 0) return [];

  const { data: scores, error: scoresError } = await supabase
    .from('safety_scores')
    .select('station_id, score, rank, total_crimes')
    .in('station_id', stationIds)
    .eq('year', year);

  if (scoresError) throw scoresError;

  const scoreMap = new Map<string, { score: number; rank: number | null; totalCrimes: number }>();
  for (const s of scores ?? []) {
    scoreMap.set(s.station_id, { score: s.score, rank: s.rank, totalCrimes: s.total_crimes ?? 0 });
  }

  return stations
    .map((s) => ({
      ...s,
      safetyScore: scoreMap.get(s.id as string)?.score ?? null,
      safetyRank: scoreMap.get(s.id as string)?.rank ?? null,
      totalCrimes: scoreMap.get(s.id as string)?.totalCrimes ?? 0,
    }))
    .sort((a, b) => (b.safetyScore ?? 0) - (a.safetyScore ?? 0));
}

/**
 * 駅座標から半径内の丁目犯罪データを取得（PostGIS空間クエリ）
 */
export async function getNearbyAreas(lat: number, lng: number, radiusM = 500) {
  const supabase = createSupabaseClient();
  const { data } = await supabase.rpc('get_nearby_areas', {
    station_lat: lat,
    station_lng: lng,
    radius_m: radiusM,
  });
  return snakeToCamelArray((data ?? []) as Record<string, unknown>[]);
}

/**
 * エリア座標から半径内の駅を取得（PostGIS空間クエリ）
 */
export async function getNearbyStations(lat: number, lng: number, radiusM = 1000) {
  const supabase = createSupabaseClient();
  const { data } = await supabase.rpc('get_nearby_stations', {
    area_lat: lat,
    area_lng: lng,
    radius_m: radiusM,
  });
  return snakeToCamelArray((data ?? []) as Record<string, unknown>[]);
}
