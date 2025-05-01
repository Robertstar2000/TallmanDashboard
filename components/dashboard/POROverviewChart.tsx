'use client';

import { LineChart } from '@/components/charts/LineChart';
import type { ChartDataRow } from '@/lib/db/types';

const P21_SERVER = 'P21';
const POR_SERVER = 'POR';

interface POROverviewChartProps {
  data: ChartDataRow[];
}

export function POROverviewChart({ data }: POROverviewChartProps) {
  if (!data || data.length === 0) return null;

  // Map axisStep to P21 and POR values
  const dataMap: Record<string, { p21: number; por: number }> = data.reduce((acc, item) => {
    const key = item.axisStep;
    if (!key) return acc;
    const v = item.value ?? 0;
    acc[key] = acc[key] || { p21: 0, por: 0 };
    if (item.serverName === P21_SERVER) acc[key].p21 = v;
    else if (item.serverName === POR_SERVER) acc[key].por = v;
    return acc;
  }, {} as Record<string, { p21: number; por: number }>);

  // Build 12-month chart data from current month -11 to current month
  const now = new Date();
  const offsets = Array.from({ length: 12 }, (_, i) => -11 + i);
  const chartData = offsets.map(off => {
    const dt = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const label = dt.toLocaleString('default', { month: 'short' });
    const axisKey = off === 0 ? 'Month -0' : `Month ${off}`;
    return {
      date: label,
      p21: dataMap[axisKey]?.p21 ?? 0,
      por: dataMap[axisKey]?.por ?? 0,
    };
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">POR Overview</h3>
      <div className="h-[200px] w-full">
        <LineChart
          data={chartData}
          xKey="date"
          lines={[
            { key: 'p21', name: 'P21', color: '#4F46E5' },
            { key: 'por', name: 'POR', color: '#10B981' }
          ]}
          yAxisLabel="Value"
          xAxisLabel="Month"
          interval="month"
        />
      </div>
    </div>
  );
}
