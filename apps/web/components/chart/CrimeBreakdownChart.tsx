'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CrimeBreakdownChartProps {
  crimesViolent: number;
  crimesAssault: number;
  crimesTheft: number;
  crimesIntellectual: number;
  crimesOther: number;
}

const CATEGORIES = [
  { key: 'crimesViolent', label: '凶悪犯', color: '#ef4444' },
  { key: 'crimesAssault', label: '粗暴犯', color: '#f97316' },
  { key: 'crimesTheft', label: '窃盗犯', color: '#3b82f6' },
  { key: 'crimesIntellectual', label: '知能犯', color: '#8b5cf6' },
  { key: 'crimesOther', label: 'その他', color: '#6b7280' },
] as const;

export function CrimeBreakdownChart(props: CrimeBreakdownChartProps) {
  const data = CATEGORIES.map((cat) => ({
    name: cat.label,
    value: props[cat.key],
    color: cat.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 50 }}>
        <XAxis type="number" tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={50} />
        <Tooltip formatter={(value) => [`${value}件`]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
