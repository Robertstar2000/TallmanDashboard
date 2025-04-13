'use client';

import { LineChart } from '@/components/charts/LineChart';
import { ChartDataRow } from '@/lib/db/types';

interface DailyOrdersChartProps {
  data: ChartDataRow[];
}

export function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  // Ensure we have valid data to display
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

  // Transform data: Map axisStep to date and value to orders
  const transformedData = data
    .map(item => {
      // Skip items with null axisStep (date)
      if (item.axisStep === null) {
        return null; // Will be filtered out later
      }
      return {
        date: item.axisStep, // Use axisStep as date
        orders: item.value ?? 0 // Use value as orders, default null to 0
      };
    })
    .filter(item => item !== null) as { date: string; orders: number }[]; // Filter out nulls and assert type

  // Sort transformed data by date (assuming axisStep represents sortable dates/periods)
  const sortedData = [...transformedData].sort((a, b) => {
    // Basic string sort, adjust if axisStep needs numeric or Date parsing
    return a.date.localeCompare(b.date);
  });

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Daily Orders</h3>
      <div className="h-[200px]">
        <LineChart
          data={sortedData} // Use sorted, transformed data
          xKey="date"
          lines={[
            { key: 'orders', name: 'Orders', color: '#4C51BF' }
          ]}
        />
      </div>
    </div>
  );
}
