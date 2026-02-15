import type { HazardData } from '@hikkoshinoise/shared';
import { ScoreGauge } from '@hikkoshinoise/ui';

interface HazardSectionProps {
  data: HazardData | null;
}

const subScores = [
  { key: 'floodScore', label: '洪水', color: 'bg-blue-500' },
  { key: 'landslideScore', label: '土砂災害', color: 'bg-amber-700' },
  { key: 'tsunamiScore', label: '津波', color: 'bg-cyan-500' },
  { key: 'liquefactionScore', label: '液状化', color: 'bg-orange-500' },
] as const;

export function HazardSection({ data }: HazardSectionProps) {
  if (!data) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">⚠️ 災害リスク (Hazard)</h2>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <p>災害リスクデータは現在準備中です。データが揃い次第、洪水・土砂災害・津波・液状化のリスク情報を表示します。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">⚠️ 災害リスク (Hazard)</h2>

      <ScoreGauge score={data.score} label="災害リスク偏差値" />

      <div className="space-y-3">
        {subScores.map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className="w-20 text-sm">{s.label}</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 ${s.color} rounded-full`}
                style={{ width: `${data[s.key]}%` }}
              />
            </div>
            <span className="w-10 text-right text-sm font-medium">{data[s.key]}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
