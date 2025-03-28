'use client';

import { LineChart } from '@/components/charts/LineChart';

interface CustomerMetricsChartProps {
  data: any[];
}

export function CustomerMetricsChart({ data }: CustomerMetricsChartProps) {
  if (!data?.length) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Customer Metrics</h3>
      <div className="h-[200px] w-full">
        <LineChart
          data={data}
          xKey="date"
          lines={[
            { key: 'newCustomers', name: 'New Customers', color: '#F59E0B' },
            { key: 'prospects', name: 'Prospects', color: '#6366F1' }
          ]}
          yAxisLabel="Count"
          xAxisLabel="Month"
          interval="month"
        />
      </div>
    </div>
  );
}
