'use client';

import { BarChart } from '@/components/charts/BarChart';
import { useEffect } from 'react';
import { ChartDataRow } from '@/lib/db/types';

interface ARAgingChartProps {
  data: ChartDataRow[];
}

export function ARAgingChart({ data }: ARAgingChartProps) {
  useEffect(() => {
    console.log('AR Aging Chart received data:', data);
    if (!data || data.length === 0) {
      console.warn('AR Aging Chart: No data received or empty array');
    }
  }, [data]);

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.warn('ARAgingChart: Invalid or empty data');
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">AR Aging</h3>
        <div className="h-[200px] w-full flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  // Define the expected time buckets and their order
  const bucketOrder = ['Current (0-30 days)', '31-60 days', '61-90 days', 'Over 90 days'];

  // Transform data correctly using axisStep and value
  const chartInputData = bucketOrder.map(bucket => {
    const bucketData = data.find(item => item.axisStep === bucket);
    return {
      range: bucket, // Use 'range' as expected by BarChart
      amount: bucketData ? (bucketData.value ?? 0) : 0 // Use 'amount', default null/undefined to 0
    };
  });
  // Note: We don't filter out zeros here, as BarChart can display zero-height bars.

  console.log('Transformed AR Aging data for BarChart:', chartInputData);

  // Since we don't filter zeros, we don't need the second check for empty data

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">AR Aging</h3>
      <div className="h-[200px] w-full">
        <BarChart
          data={chartInputData} // Pass the correctly transformed data
          xKey="range" // BarChart expects 'range' for x-axis
          yKey="amount" // BarChart expects 'amount' for y-axis
          color="#4F46E5"
          yAxisLabel="Amount ($)"
          xAxisLabel="Age Range"
        />
      </div>
    </div>
  );
}
