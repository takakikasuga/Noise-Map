'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';

interface SearchBarProps {
  stations: { name: string; nameEn: string }[];
  areas?: { areaName: string; nameEn: string }[];
  cities?: { name: string; nameEn: string }[];
}

type SearchResult = {
  label: string;
  nameEn: string;
  type: 'city' | 'station' | 'area';
};

/**
 * 駅名・エリア名検索コンポーネント
 * テキスト入力 + サジェスト機能
 */
export function SearchBar({ stations, areas = [], cities = [] }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      if (value.trim() === '') {
        setFiltered([]);
        setShowDropdown(false);
        return;
      }

      const results: SearchResult[] = [];

      // 市区町村を検索（前方一致）— 住環境検索の主導線として最上位
      const cityMatches = cities
        .filter((c) => c.name.startsWith(value))
        .slice(0, 5)
        .map((c) => ({
          label: c.name,
          nameEn: c.nameEn,
          type: 'city' as const,
        }));
      results.push(...cityMatches);

      // 駅を検索（前方一致）
      const stationMatches = stations
        .filter((s) => s.name.startsWith(value))
        .slice(0, 5)
        .map((s) => ({
          label: s.name,
          nameEn: s.nameEn,
          type: 'station' as const,
        }));
      results.push(...stationMatches);

      // エリアを検索（部分一致、「市区町村」省略対応）
      const normalize = (s: string) => s.replace(/[市区町村郡]/g, '');
      const valueNorm = normalize(value);
      const areaMatches = areas
        .filter((a) => a.areaName.includes(value) || normalize(a.areaName).includes(valueNorm))
        .slice(0, 5)
        .map((a) => ({
          label: a.areaName,
          nameEn: a.nameEn,
          type: 'area' as const,
        }));
      results.push(...areaMatches);

      setFiltered(results);
      setShowDropdown(true);
    },
    [stations, areas, cities],
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setShowDropdown(false);
      setQuery('');
      track('search_click', { type: result.type });
      if (result.type === 'city') {
        router.push(`/city/${result.nameEn}`);
      } else if (result.type === 'station') {
        router.push(`/station/${result.nameEn}`);
      } else {
        router.push(`/area/${result.nameEn}`);
      }
    },
    [router],
  );

  const handleBlur = useCallback(() => {
    blurTimeout.current = setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (blurTimeout.current) {
      clearTimeout(blurTimeout.current);
      blurTimeout.current = null;
    }
    if (query.trim() !== '') {
      setShowDropdown(true);
    }
  }, [query]);

  const cityResults = filtered.filter((r) => r.type === 'city');
  const stationResults = filtered.filter((r) => r.type === 'station');
  const areaResults = filtered.filter((r) => r.type === 'area');

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="駅名・エリア名を入力して検索…"
        name="search"
        autoComplete="off"
        spellCheck={false}
        aria-label="駅名・エリア名を検索"
        role="combobox"
        aria-expanded={showDropdown && query.trim() !== ''}
        aria-controls="search-listbox"
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
      />
      {showDropdown && query.trim() !== '' && (
        <ul id="search-listbox" role="listbox" className="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.length > 0 ? (
            <>
              {cityResults.length > 0 && (
                <>
                  <li className="px-4 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                    市区町村
                  </li>
                  {cityResults.map((r) => (
                    <li
                      key={`city-${r.nameEn}`}
                      role="option"
                      onMouseDown={() => handleSelect(r)}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-50"
                    >
                      {r.label}
                    </li>
                  ))}
                </>
              )}
              {stationResults.length > 0 && (
                <>
                  <li className="px-4 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                    駅
                  </li>
                  {stationResults.map((r) => (
                    <li
                      key={`station-${r.nameEn}`}
                      role="option"
                      onMouseDown={() => handleSelect(r)}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-50"
                    >
                      {r.label}駅
                    </li>
                  ))}
                </>
              )}
              {areaResults.length > 0 && (
                <>
                  <li className="px-4 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                    エリア
                  </li>
                  {areaResults.map((r) => (
                    <li
                      key={`area-${r.nameEn}`}
                      role="option"
                      onMouseDown={() => handleSelect(r)}
                      className="cursor-pointer px-4 py-2 hover:bg-blue-50"
                    >
                      <span>{r.label}</span>
                    </li>
                  ))}
                </>
              )}
            </>
          ) : (
            <li className="px-4 py-2 italic text-gray-400">候補なし</li>
          )}
        </ul>
      )}
    </div>
  );
}
