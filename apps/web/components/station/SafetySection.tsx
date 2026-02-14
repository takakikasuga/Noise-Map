import type { SafetyScore } from '@hikkoshinoise/shared';

interface SafetySectionProps {
  data: SafetyScore;
}

/**
 * 治安セクションコンポーネント
 * 犯罪発生件数・種別をグラフとスコアで表示
 */
export function SafetySection({ data }: SafetySectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">治安</h2>
      <p className="text-gray-400">治安スコア: {data.score}</p>
    </section>
  );
}
