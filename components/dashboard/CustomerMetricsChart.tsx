'use client';

import { LineChart } from '@/components/charts/LineChart';
import { ChartDataRow } from '@/lib/db/types';

const NEW_CUSTOMERS_VAR = 'customer_metrics_new';
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

  const transformedData = data.reduce((acc, item) => {
    const date = item.axisStep;
    
    if (date === null) {
      console.warn('Skipping customer metrics item with null axisStep:', item);
      return acc;
    }

    const variableName = item.variableName;
    const value = item.value ?? 0; 

    if (!acc[date]) {
      acc[date] = { date: date, newCustomers: 0, prospects: 0 }; 
    }

    if (variableName === NEW_CUSTOMERS_VAR) {
      acc[date].newCustomers = value;
    } else if (variableName === PROSPECTS_VAR) {
      acc[date].prospects = value;
    }

    return acc;
  }, {} as { [date: string]: { date: string; newCustomers: number; prospects: number } });

  const chartData = Object.values(transformedData);

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
