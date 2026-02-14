interface NoiseScoreProps {
  score: number;
  label: string;
  maxScore?: number;
}

/**
 * ノイズスコア表示コンポーネント（100点満点）
 */
export function NoiseScore({ score, label, maxScore = 100 }: NoiseScoreProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-3xl font-bold">{score}</div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-xs text-gray-400">/ {maxScore}</div>
      </div>
    </div>
  );
}
