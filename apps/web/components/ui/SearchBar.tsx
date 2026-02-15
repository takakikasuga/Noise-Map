'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  stations: { name: string; nameEn: string }[];
}

/**
 * 駅名検索コンポーネント
 * テキスト入力 + サジェスト機能
 */
export function SearchBar({ stations }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<{ name: string; nameEn: string }[]>([]);
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
      const matches = stations
        .filter((s) => s.name.startsWith(value))
        .slice(0, 10);
      setFiltered(matches);
      setShowDropdown(true);
    },
    [stations],
  );

  const handleSelect = useCallback(
    (nameEn: string) => {
      setShowDropdown(false);
      setQuery('');
      router.push(`/station/${nameEn}`);
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

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder="駅名を入力して検索..."
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
      {showDropdown && query.trim() !== '' && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.length > 0 ? (
            filtered.map((station) => (
              <li
                key={station.nameEn}
                onMouseDown={() => handleSelect(station.nameEn)}
                className="cursor-pointer px-4 py-2 hover:bg-blue-50"
              >
                {station.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 italic text-gray-400">候補なし</li>
          )}
        </ul>
      )}
    </div>
  );
}
