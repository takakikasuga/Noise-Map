import type { HazardData } from '@hikkoshinoise/shared';

interface HazardSectionProps {
  data: HazardData;
}

/**
 * 災害リスクセクションコンポーネント
 * 洪水・土砂・津波・液状化リスクを表示
 */
export function HazardSection({ data }: HazardSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">災害リスク</h2>
      <p className="text-gray-400">災害スコア: {data.score}</p>
    </section>
  );
}
