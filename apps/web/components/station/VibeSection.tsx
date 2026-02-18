import type { AreaVibeData, DataSourceLevel } from '@hikkoshimap/shared';
import { Badge } from '@hikkoshimap/ui';

interface VibeSectionProps {
  data: AreaVibeData;
}

function DataQualityNote({ level }: { level: DataSourceLevel }) {
  if (level === 'municipality') {
    return (
      <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-800">
        この地域の人口データは市区町村レベルの推計値です
      </div>
    );
  }
  if (level === 'small_area') {
    return (
      <div className="rounded-md border-l-4 border-green-400 bg-green-50 p-3 text-sm text-green-800">
        この地域の人口データは町丁目レベルの統計値です
      </div>
    );
  }
  if (level === 'no_population') {
    return (
      <div className="rounded-md border-l-4 border-gray-300 bg-gray-50 p-3 text-sm text-gray-600">
        この地域の人口データは取得できませんでした
      </div>
    );
  }
  return null;
}

function PopulationBar({ label, ratio, color }: { label: string; ratio: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full">
        <div className={`h-2 ${color} rounded-full`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="w-12 text-right text-sm">{(ratio * 100).toFixed(1)}%</span>
    </div>
  );
}

function getDaytimeInterpretation(ratio: number): string {
  if (ratio > 1.5) return `オフィス街・繁華街 (昼間人口が夜間の ${ratio.toFixed(2)}倍)`;
  if (ratio < 0.8) return 'ベッドタウン (住宅中心のエリア)';
  return '昼夜バランス型';
}

const facilities = [
  { key: 'restaurantCount', icon: '🍽️', label: '飲食店' },
  { key: 'convenienceStoreCount', icon: '🏪', label: 'コンビニ' },
  { key: 'parkCount', icon: '🌳', label: '公園' },
  { key: 'schoolCount', icon: '🏫', label: '学校' },
  { key: 'hospitalCount', icon: '🏥', label: '病院' },
] as const;

export function VibeSection({ data }: VibeSectionProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold">🎭 街の雰囲気 (Vibe)</h2>

      <DataQualityNote level={data.dataSourceLevel} />

      <div className="flex flex-wrap gap-2">
        {data.tags.map((tag) => (
          <Badge key={tag} label={tag} color="blue" />
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-medium">年齢構成</h3>
        <PopulationBar label="若年層" ratio={data.populationYoungRatio} color="bg-blue-500" />
        <PopulationBar label="ファミリー層" ratio={data.populationFamilyRatio} color="bg-green-500" />
        <PopulationBar label="高齢者 (65歳+)" ratio={data.populationElderlyRatio} color="bg-amber-500" />
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-medium">世帯構成</h3>
        <PopulationBar label="単身世帯" ratio={data.singleHouseholdRatio} color="bg-purple-500" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-medium">昼間人口比率</h3>
        <p className="text-2xl font-bold">{data.daytimePopulationRatio.toFixed(2)}</p>
        <p className="text-sm text-gray-600">{getDaytimeInterpretation(data.daytimePopulationRatio)}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-base font-medium">周辺施設</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {facilities.map((f) => (
            <div key={f.key} className="flex items-center gap-2 rounded-lg border p-3">
              <span className="text-xl">{f.icon}</span>
              <div>
                <p className="text-lg font-bold">{data[f.key]}</p>
                <p className="text-xs text-gray-600">{f.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
