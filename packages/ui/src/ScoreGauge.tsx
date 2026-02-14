interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

/** スコアゲージコンポーネント（円形プログレス） */
export function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  // スコアに応じた色変化
  const getColor = (s: number): string => {
    if (s <= 30) return 'text-red-500';
    if (s <= 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  const sizeStyles = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex items-center justify-center rounded-full border-4 font-bold ${sizeStyles[size]} ${getColor(score)}`}>
        {score}
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
