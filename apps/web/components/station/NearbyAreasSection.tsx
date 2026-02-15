import Link from 'next/link';
import { ScoreBadge } from '@hikkoshinoise/ui';

interface NearbyArea {
  areaName: string;
  nameEn: string;
  municipalityName: string;
  totalCrimes: number;
  score: number;
  rank: number;
}

interface NearbyAreasSectionProps {
  areas: NearbyArea[];
}

export function NearbyAreasSection({ areas }: NearbyAreasSectionProps) {
  if (areas.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold">周辺エリアの治安</h2>
        <p className="mt-2 text-gray-400">周辺の犯罪データは準備中です</p>
      </div>
    );
  }

  // Sort by total crimes ascending (safest first)
  const sorted = [...areas].sort((a, b) => a.totalCrimes - b.totalCrimes);

  return (
    <div>
      <h2 className="text-xl font-semibold">周辺エリアの治安</h2>
      <p className="mt-1 mb-4 text-sm text-gray-500">駅から半径500m以内のエリア（犯罪件数が少ない順）</p>
      <div className="space-y-2">
        {sorted.map((area, i) => (
          <Link
            key={area.nameEn}
            href={`/area/${area.nameEn}`}
            className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3 transition hover:bg-gray-100"
          >
            <span className="w-6 text-center text-sm font-bold text-gray-400">{i + 1}</span>
            <span className="flex-1 font-medium text-sm">{area.areaName}</span>
            <span className="text-sm text-gray-500">{area.totalCrimes}件</span>
            <ScoreBadge score={area.score} />
          </Link>
        ))}
      </div>
    </div>
  );
}
