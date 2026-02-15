'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CrimeTrendChartProps {
  data: Array<{ year: number; totalCrimes: number }>;
  selectedYear: number;
}

export function CrimeTrendChart({ data, selectedYear }: CrimeTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} width={50} />
        <Tooltip
          formatter={(value) => [`${value}件`, '犯罪件数']}
          labelFormatter={(label) => `${label}年`}
        />
        <Line
          type="monotone"
          dataKey="totalCrimes"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={({ cx, cy, payload }) => {
            const isSelected = payload.year === selectedYear;
            return (
              <circle
                key={payload.year}
                cx={cx}
                cy={cy}
                r={isSelected ? 6 : 3}
                fill={isSelected ? '#2563eb' : '#3b82f6'}
                stroke={isSelected ? '#2563eb' : '#3b82f6'}
                strokeWidth={isSelected ? 2 : 1}
              />
            );
          }}
          activeDot={{ r: 5, fill: '#2563eb' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
