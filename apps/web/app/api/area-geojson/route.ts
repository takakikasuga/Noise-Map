import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@hikkoshinoise/supabase';

type AreaRow = { area_name: string; name_en: string; score: number; geojson: string };

export async function GET() {
  const supabase = createSupabaseClient();

  // Supabase PostgREST のデフォルト上限は1,000行
  // 全5,075エリアを取得するためページネーションする
  const PAGE_SIZE = 1000;
  const allRows: AreaRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .rpc('get_area_geojson')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as AreaRow[];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const features = allRows.map((row) => ({
    type: 'Feature' as const,
    geometry: JSON.parse(row.geojson),
    properties: {
      areaName: row.area_name,
      nameEn: row.name_en,
      score: row.score,
    },
  }));

  const featureCollection = {
    type: 'FeatureCollection',
    features,
  };

  return NextResponse.json(featureCollection, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
