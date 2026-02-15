'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Area {
  areaName: string;
  nameEn: string;
  score: number;
  rank: number | null;
  totalCrimes: number;
}

const INITIAL_COUNT = 20;

function scoreColor(score: number) {
  if (score >= 55) return 'text-green-600';
  if (score >= 45) return 'text-gray-600';
  return 'text-red-600';
}

export function AreaList({ areas }: { areas: Area[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? areas : areas.slice(0, INITIAL_COUNT);
  const hasMore = areas.length > INITIAL_COUNT;

  return (
    <div>
      <div className="divide-y">
        {visible.map((area, i) => (
          <Link
            key={area.nameEn}
            href={`/area/${area.nameEn}`}
            className="flex items-center justify-between px-3 py-2.5 transition hover:bg-gray-50"
          >
            <span className="flex items-center gap-3">
              <span className="w-8 text-right text-xs text-gray-400">
                {i + 1}
              </span>
              <span className="text-sm">{area.areaName}</span>
            </span>
            <span className="flex items-center gap-4">
              <span className="text-xs text-gray-400">
                {area.totalCrimes.toLocaleString()}件
              </span>
              <span className={`text-sm font-semibold ${scoreColor(area.score)}`}>
                {area.score.toFixed(1)}
              </span>
            </span>
          </Link>
        ))}
      </div>
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
        >
          全 {areas.length} 件を表示する
        </button>
      )}
    </div>
  );
}
