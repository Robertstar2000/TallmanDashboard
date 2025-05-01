'use client';

import { LineChart } from '@/components/charts/LineChart';
import { ChartDataRow } from '@/lib/db/types';

interface DailyOrdersChartProps {
  data: ChartDataRow[];
}

export function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  console.log('[DailyOrdersChart] Received data prop:', data); // DEBUG LOG

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

  // Helper function to parse 'Today-X' into a numerical offset
  const parseDayOffset = (axisStep: string): number => {
    if (axisStep === 'Today') return 0;
    const match = axisStep.match(/^Today-(\d+)$/);
    return match ? -parseInt(match[1], 10) : NaN; // Return NaN for unparseable formats
  };

  // Transform data: Map axisStep to date, parse offset, and include value
  const transformedData = data
    .map(item => {
      // Skip items with null or unparseable axisStep
      if (item.axisStep === null) {
        return null;
      }
      const offset = parseDayOffset(item.axisStep);
      if (isNaN(offset)) {
        console.warn(`Could not parse axisStep for Daily Orders: ${item.axisStep}`);
        return null; // Filter out items with unparseable axisStep
      }
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() + offset);
      const date = dateObj.toISOString().split('T')[0];
      return {
        date,
        dateLabel: item.axisStep, // Keep original label for display
        dayOffset: offset,      // Numerical offset for sorting
        orders: item.value ?? 0 // Use value as orders, default null to 0
      };
    })
    .filter(item => item !== null) as { date: string; dateLabel: string; dayOffset: number; orders: number }[]; // Filter out nulls and assert type

  // Sort transformed data by the numerical dayOffset
  const sortedData = [...transformedData].sort((a, b) => a.dayOffset - b.dayOffset);

  console.log('[DailyOrdersChart] Processed sortedData:', sortedData); // DEBUG LOG

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold mb-4">Daily Orders</h3>
      <div className="h-[200px]">
        <LineChart
          data={sortedData} // Use sorted, transformed data
          xKey="date"   // Use the actual date for the X-axis
          lines={[
            { key: 'orders', name: 'Orders', color: '#4C51BF' }
          ]}
          interval="day"
          xAxisLabel="Date"
          yAxisLabel="Orders"
        />
      </div>
    </div>
  );
}
