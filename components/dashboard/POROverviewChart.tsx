'use client';

import { LineChart } from '@/components/charts/LineChart';
import type { PORDailySalesPoint } from '@/lib/db/types';

const P21_SERVER = 'P21';
const POR_SERVER = 'POR';

interface POROverviewChartProps {
  data: PORDailySalesPoint[];
}

export function POROverviewChart({ data }: POROverviewChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">POR Overview (Daily)</h3>
      <div className="h-[200px] w-full">
        <LineChart
          data={data}
          xKey="date"
          lines={[{ key: 'value', name: 'Daily Sales', color: '#10B981' }]}
          yAxisLabel="Value"
          xAxisLabel="Day"
          interval="day"
        />
      </div>
    </div>
  );
}
