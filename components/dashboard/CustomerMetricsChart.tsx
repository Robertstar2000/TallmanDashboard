'use client';

import { LineChart } from '@/components/charts/LineChart';
import { ChartDataRow } from '@/lib/db/types';

const NEW_CUSTOMERS_VAR = 'New Customers';
const PROSPECTS_VAR = 'customer_metrics_prospects';

interface CustomerMetricsChartProps {
  data: ChartDataRow[];
}

export function CustomerMetricsChart({ data }: CustomerMetricsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">Customer Metrics</h3>
        <div className="h-[200px] w-full flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Map axisStep to aggregated New Customers and Prospects counts
  const dataMap: { [key: string]: { newCustomers: number; prospects: number } } = data.reduce((acc, item) => {
    const key = item.axisStep;
    if (!key) return acc;
    const v = item.value ?? 0;
    acc[key] = acc[key] || { newCustomers: 0, prospects: 0 };
    if (item.variableName === NEW_CUSTOMERS_VAR) acc[key].newCustomers = v;
    else if (item.variableName === PROSPECTS_VAR) acc[key].prospects = v;
    return acc;
  }, {} as { [key: string]: { newCustomers: number; prospects: number } });

  // Build chartData: from current month -11 months to current month
  const now = new Date();
  const offsets = Array.from({ length: 12 }, (_, i) => -11 + i);
  const chartData = offsets.map(off => {
    const dt = new Date(now.getFullYear(), now.getMonth() + off, 1);
    const label = dt.toLocaleString('default', { month: 'short' });
    const axisKey = off === 0 ? 'Month -0' : `Month ${off}`;
    return {
      date: label,
      newCustomers: dataMap[axisKey]?.newCustomers ?? 0,
      prospects: dataMap[axisKey]?.prospects ?? 0,
    };
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Customer Metrics</h3>
      <div className="h-[200px] w-full">
        <LineChart
          data={chartData} 
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
