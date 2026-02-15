import { cache } from 'react';
import { createSupabaseClient } from '@hikkoshinoise/supabase';

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
 * 駅の雰囲気データを取得
 */
export async function getStationVibe(stationId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('vibe_data')
    .select('*')
    .eq('station_id', stationId)
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
  const { data, error } = await supabase
    .from('stations')
    .select('name, name_en, lat, lng, safety_scores(score)')
    .eq('safety_scores.year', 2025)
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
 * 治安スコア上位の駅を取得（2025年）
 */
export async function getTopStations(limit: number = 5) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('safety_scores')
    .select('score, rank, stations(name, name_en)')
    .eq('year', 2025)
    .order('score', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .filter((s) => s.stations)
    .map((s) => {
      const station = s.stations as unknown as { name: string; name_en: string };
      return {
        name: station.name,
        nameEn: station.name_en,
        score: s.score,
        rank: s.rank,
      };
    });
}

/**
 * 治安スコア下位の駅を取得（2025年）
 */
export async function getBottomStations(limit: number = 5) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('safety_scores')
    .select('score, rank, stations(name, name_en)')
    .eq('year', 2025)
    .order('score', { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .filter((s) => s.stations)
    .map((s) => {
      const station = s.stations as unknown as { name: string; name_en: string };
      return {
        name: station.name,
        nameEn: station.name_en,
        score: s.score,
        rank: s.rank,
      };
    });
}

/**
 * 治安スコア上位のエリアを取得（2025年）
 */
export async function getTopAreas(limit: number = 5) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en, score')
    .eq('year', 2025)
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
 * 治安スコア下位のエリアを取得（2025年）
 */
export async function getBottomAreas(limit: number = 5) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en, score')
    .eq('year', 2025)
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
    .select('id, content, category, rating, created_at, station_id, area_name_en, stations(name, name_en)')
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
      .eq('year', 2025);
    for (const a of areaData ?? []) {
      areaNameMap[a.name_en as string] = a.area_name as string;
    }
  }

  return rows.map((row) => {
    const station = row.stations as unknown as { name: string; name_en: string } | null;
    const areaEn = row.area_name_en as string | null;
    return {
      id: row.id as string,
      content: row.content as string,
      category: row.category as string,
      rating: row.rating as number | null,
      createdAt: row.created_at as string,
      stationName: station?.name ?? null,
      stationNameEn: station?.name_en ?? null,
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
  const { data, error } = await supabase
    .from('town_crimes')
    .select('name_en')
    .eq('year', 2025)
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
  const { data, error } = await supabase
    .from('town_crimes')
    .select('*')
    .eq('name_en', slug)
    .eq('year', 2025)
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
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en')
    .eq('year', 2025)
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
    .eq('year', 2025);

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
  const { data, error } = await supabase
    .from('town_crimes')
    .select('area_name, name_en, score, rank, total_crimes')
    .eq('municipality_name', municipalityName)
    .eq('year', 2025)
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
