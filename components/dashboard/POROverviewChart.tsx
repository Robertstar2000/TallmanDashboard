'use client';

import { LineChart } from '@/components/charts/LineChart';
import { POROverviewData } from '@/lib/types/dashboard';

interface POROverviewChartProps {
  data: POROverviewData[];
}

export function POROverviewChart({ data }: POROverviewChartProps) {
  if (!data?.length) return null;

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">POR Overview</h3>
      <div className="h-[200px] w-full">
        <LineChart
          data={sortedData}
          xKey="date"
          lines={[
            { key: 'value', name: 'Value', color: '#4F46E5' }
          ]}
          yAxisLabel="Value"
          xAxisLabel="Month"
          interval="month"
        />
      </div>
    </div>
  );
}
