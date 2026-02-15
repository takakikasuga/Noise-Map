'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { MAX_COMPARE_STATIONS } from '@/lib/constants';

interface StationSearchItem {
  name: string;
  name_en: string;
}

interface StationCompareData {
  name: string;
  nameEn: string;
  municipalityName: string;
  lines: string[];
  safety: {
    score: number;
    rank: number | null;
    totalCrimes: number;
  } | null;
  vibe: {
    tags: string[];
    restaurantCount: number;
    parkCount: number;
    populationYoungRatio: number;
    singleHouseholdRatio: number;
  } | null;
}

export function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allStations, setAllStations] = useState<StationSearchItem[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [stationData, setStationData] = useState<Map<string, StationCompareData>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StationSearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // 全駅リスト取得
  useEffect(() => {
    async function fetchStations() {
      const { data } = await supabase
        .from('stations')
        .select('name, name_en')
        .order('name');
      setAllStations(data ?? []);
      setLoading(false);
    }
    fetchStations();
  }, []);

  // URLパラメータから初期駅を読み込み
  useEffect(() => {
    const stationsParam = searchParams.get('stations');
    if (stationsParam) {
      const slugs = stationsParam.split(',').filter(Boolean).slice(0, MAX_COMPARE_STATIONS);
      setSelectedSlugs(slugs);
    }
  }, [searchParams]);

  // 駅データ取得
  const fetchStationData = useCallback(async (slug: string) => {
    if (stationData.has(slug)) return;

    const { data: station } = await supabase
      .from('stations')
      .select('*')
      .eq('name_en', slug)
      .single();

    if (!station) return;

    // async-parallel: safety と vibe を並列取得
    const [{ data: safety }, { data: vibe }] = await Promise.all([
      supabase
        .from('safety_scores')
        .select('score, rank, total_crimes')
        .eq('station_id', station.id)
        .order('year', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('vibe_data')
        .select('tags, restaurant_count, park_count, population_young_ratio, single_household_ratio')
        .eq('station_id', station.id)
        .single(),
    ]);

    const data: StationCompareData = {
      name: station.name,
      nameEn: station.name_en,
      municipalityName: station.municipality_name,
      lines: station.lines ?? [],
      safety: safety
        ? {
            score: safety.score,
            rank: safety.rank,
            totalCrimes: safety.total_crimes,
          }
        : null,
      vibe: vibe
        ? {
            tags: vibe.tags ?? [],
            restaurantCount: vibe.restaurant_count,
            parkCount: vibe.park_count,
            populationYoungRatio: vibe.population_young_ratio,
            singleHouseholdRatio: vibe.single_household_ratio,
          }
        : null,
    };

    setStationData((prev) => new Map(prev).set(slug, data));
  }, [stationData]);

  // 選択駅が変わったらデータ取得
  useEffect(() => {
    selectedSlugs.forEach(fetchStationData);
  }, [selectedSlugs, fetchStationData]);

  // URL更新
  const updateUrl = useCallback(
    (slugs: string[]) => {
      if (slugs.length > 0) {
        router.replace(`/compare?stations=${slugs.join(',')}`, { scroll: false });
      } else {
        router.replace('/compare', { scroll: false });
      }
    },
    [router],
  );

  // 駅追加
  const addStation = useCallback(
    (slug: string) => {
      if (selectedSlugs.includes(slug) || selectedSlugs.length >= MAX_COMPARE_STATIONS) return;
      const newSlugs = [...selectedSlugs, slug];
      setSelectedSlugs(newSlugs);
      updateUrl(newSlugs);
      setSearchQuery('');
      setShowDropdown(false);
    },
    [selectedSlugs, updateUrl],
  );

  // 駅削除
  const removeStation = useCallback(
    (slug: string) => {
      const newSlugs = selectedSlugs.filter((s) => s !== slug);
      setSelectedSlugs(newSlugs);
      updateUrl(newSlugs);
    },
    [selectedSlugs, updateUrl],
  );

  // 検索フィルタ
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      if (q.trim() === '') {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      const matches = allStations
        .filter(
          (s) =>
            s.name.startsWith(q) && !selectedSlugs.includes(s.name_en),
        )
        .slice(0, 10);
      setSearchResults(matches);
      setShowDropdown(true);
    },
    [allStations, selectedSlugs],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">駅を比較する</h1>
        <p className="mt-2 text-gray-600">
          2〜3駅を選んで、住環境リスクを横並びで比較できます
        </p>
      </section>

      {/* 駅選択 */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        {/* 選択済み駅 */}
        <div className="flex flex-wrap gap-3">
          {selectedSlugs.map((slug) => {
            const data = stationData.get(slug);
            return (
              <div
                key={slug}
                className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-800"
              >
                <Link href={`/station/${slug}`} className="font-medium hover:underline">
                  {data?.name ?? slug}駅
                </Link>
                <button
                  onClick={() => removeStation(slug)}
                  className="ml-1 text-blue-400 hover:text-red-500"
                  aria-label={`${data?.name ?? slug}を削除`}
                >
                  x
                </button>
              </div>
            );
          })}
        </div>

        {/* 駅追加 */}
        {selectedSlugs.length < MAX_COMPARE_STATIONS && (
          <div className="relative max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => {
                if (searchQuery.trim()) setShowDropdown(true);
              }}
              placeholder="駅名を入力して追加..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {showDropdown && searchQuery.trim() !== '' && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                {searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <li
                      key={s.name_en}
                      onMouseDown={() => addStation(s.name_en)}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      {s.name}駅
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm italic text-gray-400">候補なし</li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* 比較テーブル */}
      {selectedSlugs.length >= 2 && (
        <section className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-600">項目</th>
                {selectedSlugs.map((slug) => {
                  const data = stationData.get(slug);
                  return (
                    <th key={slug} className="px-4 py-3 text-center font-semibold">
                      <Link href={`/station/${slug}`} className="hover:text-blue-600">
                        {data?.name ?? slug}駅
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">市区町村</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    {stationData.get(slug)?.municipalityName ?? '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">路線</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center text-xs">
                    {stationData.get(slug)?.lines.join(', ') ?? '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b bg-green-50">
                <td className="px-4 py-3 font-medium text-green-800">治安スコア</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center font-bold text-lg">
                    {stationData.get(slug)?.safety?.score.toFixed(1) ?? '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">治安ランク</td>
                {selectedSlugs.map((slug) => {
                  const rank = stationData.get(slug)?.safety?.rank;
                  return (
                    <td key={slug} className="px-4 py-3 text-center">
                      {rank != null ? `${rank}位` : '-'}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">犯罪件数</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    {stationData.get(slug)?.safety?.totalCrimes ?? '-'}件
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">飲食店</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    {stationData.get(slug)?.vibe?.restaurantCount ?? '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">公園</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    {stationData.get(slug)?.vibe?.parkCount ?? '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600">タグ</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {stationData.get(slug)?.vibe?.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                        >
                          {tag}
                        </span>
                      )) ?? '-'}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {selectedSlugs.length < 2 && selectedSlugs.length > 0 && (
        <section className="rounded-lg border bg-white p-8 text-center text-gray-400">
          <p>もう1駅追加すると比較テーブルが表示されます</p>
        </section>
      )}

      {selectedSlugs.length === 0 && (
        <section className="rounded-lg border bg-white p-8 text-center text-gray-400">
          <p>上の検索バーから駅を2〜3つ選んでください</p>
        </section>
      )}
    </div>
  );
}
