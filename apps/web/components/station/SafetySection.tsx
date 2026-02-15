'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ScoreGauge } from '@hikkoshinoise/ui';

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
}

export function SafetySection({ data }: SafetySectionProps) {
  const sorted = [...data].sort((a, b) => b.year - a.year);
  const latestYear = sorted[0]?.year ?? new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(latestYear);

  const selected = sorted.find((d) => d.year === selectedYear) ?? sorted[0];
  if (!selected) return null;

  const crimeRows = [
    { label: '凶悪犯', count: selected.crimesViolent },
    { label: '粗暴犯', count: selected.crimesAssault },
    { label: '窃盗犯', count: selected.crimesTheft },
    { label: '知能犯', count: selected.crimesIntellectual },
    { label: 'その他', count: selected.crimesOther },
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
          <p className="text-sm text-gray-600">659駅中 <span className="font-bold text-lg">{selected.rank}</span>位</p>
        )}
      </div>

      <div className="flex gap-2">
        {sorted.map((d) => (
          <button
            key={d.year}
            onClick={() => setSelectedYear(d.year)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
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

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">種別</th>
            <th className="py-2 text-right">件数</th>
          </tr>
        </thead>
        <tbody>
          {crimeRows.map((row) => (
            <tr key={row.label} className="border-b">
              <td className="py-2">{row.label}</td>
              <td className="py-2 text-right">{row.count}件</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-2">合計</td>
            <td className="py-2 text-right">{selected.totalCrimes}件</td>
          </tr>
        </tbody>
      </table>

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
