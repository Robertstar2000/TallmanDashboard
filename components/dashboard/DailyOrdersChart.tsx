'use client';

import { LineChart } from '@/components/charts/LineChart';
import type { DailyOrderPoint } from '@/lib/db/types';

interface DailyOrdersChartProps {
  data: DailyOrderPoint[];
}

export function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Daily Orders</h3>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }
  // Filter out invalid entries and sort by date ascending
  const validData = data.filter(d => typeof d.date === 'string' && d.date);
  console.log('[DailyOrdersChart] validData:', validData);
  if (validData.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-4">Daily Orders</h3>
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">No daily orders data available</p>
        </div>
      </div>
    );
  }
  const sortedData = validData.sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Daily Orders</h3>
      <div className="h-[200px]">
        <LineChart
          data={sortedData}
          xKey="date"
          lines={[{ key: 'orders', name: 'Orders', color: '#4C51BF' }]}
          interval="day"
          xAxisLabel="Date"
          yAxisLabel="Orders"
        />
      </div>
    </div>
  );
}
