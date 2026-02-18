'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ScoreGauge } from '@hikkoshimap/ui';

const CrimeTrendChart = dynamic(
  () => import('@/components/chart/CrimeTrendChart').then(m => m.CrimeTrendChart),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);
const CrimeBreakdownChart = dynamic(
  () => import('@/components/chart/CrimeBreakdownChart').then(m => m.CrimeBreakdownChart),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-gray-100 rounded" /> }
);

/** クライアントに渡すデータの最小型 (server-serialization) */
interface SafetyData {
  year: number;
  score: number;
  rank: number | null;
  totalCrimes: number;
  crimesViolent: number;
  crimesAssault: number;
  crimesTheft: number;
  crimesIntellectual: number;
  crimesOther: number;
  previousYearTotal: number | null;
}

interface SafetySectionProps {
  data: SafetyData[];
  totalCount?: number;
  entityLabel?: string;
}

export function SafetySection({ data, totalCount = 659, entityLabel = '駅' }: SafetySectionProps) {
  const sorted = [...data].sort((a, b) => b.year - a.year);
  const latestYear = sorted[0]?.year ?? new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(latestYear);

  const selected = sorted.find((d) => d.year === selectedYear) ?? sorted[0];
  if (!selected) return null;

  const crimeRows = [
    { label: '凶悪犯', count: selected.crimesViolent, tip: '殺人・強盗・放火・強制性交等（警察庁 包括罪種）' },
    { label: '粗暴犯', count: selected.crimesAssault, tip: '凶器準備集合・暴行・傷害・脅迫・恐喝（警察庁 包括罪種）' },
    { label: '窃盗犯', count: selected.crimesTheft, tip: '空き巣・ひったくり・万引き・自転車盗・車上ねらい等（警察庁 包括罪種）' },
    { label: '知能犯', count: selected.crimesIntellectual, tip: '詐欺・横領・偽造・汚職・背任等（警察庁 包括罪種）' },
    { label: 'その他', count: selected.crimesOther, tip: '風俗犯（賭博・わいせつ）＋その他の刑法犯（器物損壊等）（警察庁 包括罪種）' },
  ];

  const delta =
    selected.previousYearTotal != null
      ? selected.totalCrimes - selected.previousYearTotal
      : null;
  const pctChange =
    delta != null && selected.previousYearTotal
      ? (delta / selected.previousYearTotal) * 100
      : null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">🛡️ 治安 (Safety)</h2>

      <div className="flex items-center gap-6">
        <ScoreGauge score={selected.score} label="治安偏差値" />
        {selected.rank != null && (
          <p className="text-sm text-gray-600">{totalCount}{entityLabel}中 <span className="font-bold text-lg">{selected.rank}</span>位</p>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
        {sorted.map((d) => (
          <button
            key={d.year}
            onClick={() => setSelectedYear(d.year)}
            className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              d.year === selectedYear
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {d.year}
          </button>
        ))}
      </div>

      {/* 犯罪件数推移チャート */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">犯罪件数の推移</h3>
        <CrimeTrendChart
          data={sorted.map(d => ({ year: d.year, totalCrimes: d.totalCrimes }))}
          selectedYear={selectedYear}
        />
      </div>

      {/* 犯罪種別内訳チャート */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600">{selectedYear}年 犯罪種別内訳</h3>
        <CrimeBreakdownChart
          crimesViolent={selected.crimesViolent}
          crimesAssault={selected.crimesAssault}
          crimesTheft={selected.crimesTheft}
          crimesIntellectual={selected.crimesIntellectual}
          crimesOther={selected.crimesOther}
        />
      </div>

      <div className="overflow-x-auto -mx-6 px-6">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">種別</th>
              <th className="py-2 text-right">件数</th>
            </tr>
          </thead>
          <tbody>
            {crimeRows.map((row) => (
              <tr key={row.label} className="border-b">
                <td className="py-2">
                  <span tabIndex={0} className="group relative cursor-help border-b border-dashed border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded">
                    {row.label}
                    <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden w-max max-w-[220px] rounded bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
                      {row.tip}
                    </span>
                  </span>
                </td>
                <td className="py-2 text-right">{row.count}件</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-2">合計</td>
              <td className="py-2 text-right">{selected.totalCrimes}件</td>
            </tr>
          </tbody>
        </table>
      </div>

      {selectedYear === 2025 && (
        <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
          2025年のデータは1〜11月の暫定値です。12月分のデータが含まれていないため、通年データと比較すると少なく表示されます。
        </div>
      )}

      {delta != null && pctChange != null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">前年比:</span>
          {delta > 0 ? (
            <span className="flex items-center gap-1 text-red-600">
              ↑ +{delta}件 (+{pctChange.toFixed(1)}%)
            </span>
          ) : delta < 0 ? (
            <span className="flex items-center gap-1 text-green-600">
              ↓ {delta}件 ({pctChange.toFixed(1)}%)
            </span>
          ) : (
            <span className="text-gray-600">±0件 (0%)</span>
          )}
        </div>
      )}
    </section>
  );
}
