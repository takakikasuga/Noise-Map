interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function scoreToHue(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return (clamped / 100) * 120;
}

/** 偏差値ゲージコンポーネント（円形プログレス） */
export function ScoreGauge({ score, label, size = 'md' }: ScoreGaugeProps) {
  const hue = scoreToHue(score);
  const bg = `hsl(${hue}, 70%, 93%)`;
  const border = `hsl(${hue}, 70%, 45%)`;
  const text = `hsl(${hue}, 70%, 28%)`;

  const sizeStyles = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex items-center justify-center rounded-full border-4 font-bold ${sizeStyles[size]}`}
        style={{ backgroundColor: bg, borderColor: border, color: text }}
      >
        {(score ?? 0).toFixed(1)}
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

/** 偏差値バッジ（インライン用） */
export function ScoreBadge({ score }: { score: number }) {
  const hue = scoreToHue(score);
  const bg = `hsl(${hue}, 70%, 93%)`;
  const text = `hsl(${hue}, 70%, 28%)`;

  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {(score ?? 0).toFixed(1)}
    </span>
  );
}
