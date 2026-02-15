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
    .from('stations')
    .select('name, name_en, safety_scores(score, rank)')
    .eq('safety_scores.year', 2025)
    .order('score', { referencedTable: 'safety_scores', ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .filter((s) => s.safety_scores && (s.safety_scores as unknown[]).length > 0)
    .map((s) => {
      const scores = s.safety_scores as { score: number; rank: number | null }[];
      return {
        name: s.name,
        nameEn: s.name_en,
        score: scores[0].score,
        rank: scores[0].rank,
      };
    });
}

/**
 * 治安スコア下位の駅を取得（2025年）
 */
export async function getBottomStations(limit: number = 5) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('stations')
    .select('name, name_en, safety_scores(score, rank)')
    .eq('safety_scores.year', 2025)
    .order('score', { referencedTable: 'safety_scores', ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? [])
    .filter((s) => s.safety_scores && (s.safety_scores as unknown[]).length > 0)
    .map((s) => {
      const scores = s.safety_scores as { score: number; rank: number | null }[];
      return {
        name: s.name,
        nameEn: s.name_en,
        score: scores[0].score,
        rank: scores[0].rank,
      };
    });
}
