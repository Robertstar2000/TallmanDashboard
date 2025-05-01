'use client';

import { LineChart } from '@/components/charts/LineChart';
import { WebOrderPoint } from '@/lib/db/types';

interface WebOrdersChartProps {
  data: WebOrderPoint[];
}

export function WebOrdersChart({ data }: WebOrdersChartProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Web Orders</h3>
      <div className="h-[200px]">
        <LineChart
          data={data}
          xKey="date"
          lines={[
            { key: 'orders', name: 'Orders', color: '#48BB78' },
            { key: 'revenue', name: 'Revenue', color: '#3182CE' }
          ]}
          yAxisLabel="Orders / Revenue"
        />
      </div>
    </div>
  );
}
