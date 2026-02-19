'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScoreBadge } from '@hikkoshimap/ui';
import { supabase } from '@/lib/supabase';
import { MAX_COMPARE_AREAS } from '@/lib/constants';

interface AreaSearchItem {
  area_name: string;
  name_en: string;
}

interface AreaCompareData {
  areaName: string;
  nameEn: string;
  municipalityName: string;
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
  const [allAreas, setAllAreas] = useState<AreaSearchItem[]>([]);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [areaData, setAreaData] = useState<Map<string, AreaCompareData>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AreaSearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestYear, setLatestYear] = useState<number | null>(null);

  // 最新年度を取得してからエリアリストを取得
  useEffect(() => {
    async function fetchAreas() {
      // 最新年度を取得
      const { data: yearRow } = await supabase
        .from('town_crimes')
        .select('year')
        .order('year', { ascending: false })
        .limit(1)
        .single();

      const year = yearRow?.year ?? null;
      setLatestYear(year);

      if (!year) {
        setLoading(false);
        return;
      }

      // 最新年度のエリアリストを全件取得（Supabase デフォルト上限 1000 行を回避）
      const PAGE_SIZE = 1000;
      let allRows: { area_name: string; name_en: string }[] = [];
      let from = 0;
      while (true) {
        const { data: page } = await supabase
          .from('town_crimes')
          .select('area_name, name_en')
          .eq('year', year)
          .not('name_en', 'is', null)
          .order('area_name')
          .range(from, from + PAGE_SIZE - 1);
        if (!page || page.length === 0) break;
        allRows = allRows.concat(page);
        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      // name_en で重複排除
      const seen = new Set<string>();
      const deduped: AreaSearchItem[] = [];
      for (const row of allRows) {
        if (!seen.has(row.name_en)) {
          seen.add(row.name_en);
          deduped.push({ area_name: row.area_name, name_en: row.name_en });
        }
      }

      setAllAreas(deduped);
      setLoading(false);
    }
    fetchAreas();
  }, []);

  // URLパラメータから初期エリアを読み込み
  useEffect(() => {
    const areasParam = searchParams.get('areas');
    if (areasParam) {
      const slugs = areasParam.split(',').filter(Boolean).slice(0, MAX_COMPARE_AREAS);
      setSelectedSlugs(slugs);
    }
  }, [searchParams]);

  // エリアデータ取得
  const fetchedRef = useRef(new Set<string>());
  const fetchAreaData = useCallback(async (slug: string) => {
    if (fetchedRef.current.has(slug) || !latestYear) return;
    fetchedRef.current.add(slug);

    // Safety データ取得（最新年度）
    const { data: crime } = await supabase
      .from('town_crimes')
      .select('area_name, municipality_name, score, rank, total_crimes')
      .eq('name_en', slug)
      .order('year', { ascending: false })
      .limit(1)
      .single();

    if (!crime) {
      fetchedRef.current.delete(slug);
      return;
    }

    // Vibe データ取得
    const { data: vibe } = await supabase
      .from('area_vibe_data')
      .select('tags, restaurant_count, park_count, population_young_ratio, single_household_ratio')
      .eq('area_name', crime.area_name)
      .single();

    const data: AreaCompareData = {
      areaName: crime.area_name,
      nameEn: slug,
      municipalityName: crime.municipality_name,
      safety: {
        score: crime.score,
        rank: crime.rank,
        totalCrimes: crime.total_crimes,
      },
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

    setAreaData((prev) => new Map(prev).set(slug, data));
  }, [latestYear]);

  // 選択エリアが変わったらデータ取得
  useEffect(() => {
    selectedSlugs.forEach(fetchAreaData);
  }, [selectedSlugs, fetchAreaData]);

  // URL更新
  const updateUrl = useCallback(
    (slugs: string[]) => {
      if (slugs.length > 0) {
        router.replace(`/compare?areas=${slugs.join(',')}`, { scroll: false });
      } else {
        router.replace('/compare', { scroll: false });
      }
    },
    [router],
  );

  // エリア追加
  const addArea = useCallback(
    (slug: string) => {
      if (selectedSlugs.includes(slug) || selectedSlugs.length >= MAX_COMPARE_AREAS) return;
      const newSlugs = [...selectedSlugs, slug];
      setSelectedSlugs(newSlugs);
      updateUrl(newSlugs);
      setSearchQuery('');
      setShowDropdown(false);
    },
    [selectedSlugs, updateUrl],
  );

  // エリア削除
  const removeArea = useCallback(
    (slug: string) => {
      const newSlugs = selectedSlugs.filter((s) => s !== slug);
      setSelectedSlugs(newSlugs);
      updateUrl(newSlugs);
    },
    [selectedSlugs, updateUrl],
  );

  // 検索フィルタ（「市」「区」「町」「村」省略でもマッチ）
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      if (q.trim() === '') {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      // 「市区町村」等を除去した正規化文字列でも比較
      const normalize = (s: string) => s.replace(/[市区町村郡]/g, '');
      const qNorm = normalize(q);
      const matches = allAreas
        .filter(
          (s) =>
            !selectedSlugs.includes(s.name_en) &&
            (s.area_name.includes(q) || normalize(s.area_name).includes(qNorm)),
        )
        .slice(0, 10);
      setSearchResults(matches);
      setShowDropdown(true);
    },
    [allAreas, selectedSlugs],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">エリアを比較する</h1>
        <p className="mt-2 text-gray-600">
          2〜3エリアを選んで、住環境リスクを横並びで比較できます
        </p>
      </section>

      {/* エリア選択 */}
      <section className="rounded-lg border bg-white p-6 space-y-4">
        {/* 選択済みエリア */}
        <div className="flex flex-wrap gap-3">
          {selectedSlugs.map((slug) => {
            const data = areaData.get(slug);
            return (
              <div
                key={slug}
                className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-blue-800"
              >
                <Link href={`/area/${slug}`} className="font-medium hover:underline">
                  {data?.areaName ?? slug}
                </Link>
                <button
                  onClick={() => removeArea(slug)}
                  className="ml-1 text-blue-400 hover:text-red-500"
                  aria-label={`${data?.areaName ?? slug}を削除`}
                >
                  x
                </button>
              </div>
            );
          })}
        </div>

        {/* エリア追加 */}
        {selectedSlugs.length < MAX_COMPARE_AREAS && (
          <div className="relative max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              onFocus={() => {
                if (searchQuery.trim()) setShowDropdown(true);
              }}
              placeholder="エリア名を入力して追加…"
              name="area-search"
              autoComplete="off"
              spellCheck={false}
              aria-label="比較するエリアを検索"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            />
            {showDropdown && searchQuery.trim() !== '' && (
              <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                {searchResults.length > 0 ? (
                  searchResults.map((s) => (
                    <li
                      key={s.name_en}
                      role="option"
                      onMouseDown={() => addArea(s.name_en)}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      {s.area_name}
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
                  const data = areaData.get(slug);
                  return (
                    <th key={slug} className="px-4 py-3 text-center font-semibold">
                      <Link href={`/area/${slug}`} className="hover:text-blue-600">
                        {data?.areaName ?? slug}
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
                    {areaData.get(slug)?.municipalityName ?? '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b bg-green-50">
                <td className="px-4 py-3 font-medium text-green-800">治安偏差値</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center font-bold text-lg">
                    {areaData.get(slug)?.safety?.score != null
                      ? <ScoreBadge score={areaData.get(slug)!.safety!.score} />
                      : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">治安ランク</td>
                {selectedSlugs.map((slug) => {
                  const rank = areaData.get(slug)?.safety?.rank;
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
                    {areaData.get(slug)?.safety?.totalCrimes ?? '-'}件
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">飲食店</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    {areaData.get(slug)?.vibe?.restaurantCount ?? '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="px-4 py-3 text-gray-600">公園</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    {areaData.get(slug)?.vibe?.parkCount ?? '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-3 text-gray-600">タグ</td>
                {selectedSlugs.map((slug) => (
                  <td key={slug} className="px-4 py-3 text-center">
                    <div className="flex flex-wrap justify-center gap-1">
                      {areaData.get(slug)?.vibe?.tags.map((tag) => (
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
          <p>もう1エリア追加すると比較テーブルが表示されます</p>
        </section>
      )}

      {selectedSlugs.length === 0 && (
        <section className="rounded-lg border bg-white p-8 text-center text-gray-400">
          <p>上の検索バーからエリアを2〜3つ選んでください</p>
        </section>
      )}
    </div>
  );
}
