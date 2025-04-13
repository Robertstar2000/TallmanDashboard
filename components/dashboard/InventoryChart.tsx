'use client';

import { BarChart } from '@/components/charts/BarChart';
import { ChartDataRow } from '@/lib/db/types';

interface InventoryChartProps {
  data: ChartDataRow[];
}

export function InventoryChart({ data }: InventoryChartProps) {
  // Handle empty or undefined data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">Inventory Overview</h3>
        <div className="h-[200px] w-full flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Transform data: Map axisStep to date and value to orders
  const transformedData = data
    .map(item => {
      // Skip items with null axisStep (date)
      if (item.axisStep === null) {
        console.warn('Skipping inventory item with null axisStep:', item);
        return null; // Will be filtered out later
      }
      return {
        date: item.axisStep,
        orders: item.value ?? 0 // Use value as orders, default null to 0
      };
    })
    .filter(item => item !== null) as { date: string; orders: number }[]; // Filter out nulls and assert type

  // Sort transformed data by date
  const sortedData = [...transformedData].sort((a, b) => {
    // Add basic date string comparison or convert to Date objects if needed
    // Assuming axisStep represents months or similar sortable strings for now
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return 0;
    // Example for Date objects: new Date(a.date).getTime() - new Date(b.date).getTime()
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Inventory Overview</h3>
      <div className="h-[200px] w-full">
        <BarChart
          data={sortedData} // Use sorted, transformed data
          xKey="date"
          yKey="orders"
          color="#4F46E5"
          yAxisLabel="Units"
          xAxisLabel="Month" // Assuming axisStep represents months
          interval="month" // Assuming axisStep represents months
        />
      </div>
    </div>
  );
}
