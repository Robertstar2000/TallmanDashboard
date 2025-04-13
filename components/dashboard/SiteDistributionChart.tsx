'use client';

import { PieChart } from '@/components/charts/PieChart';
import { ChartDataRow } from '@/lib/db/types';
import { useEffect } from 'react';

interface SiteDistributionChartProps {
  data: ChartDataRow[];
}

export function SiteDistributionChart({ data }: SiteDistributionChartProps) {
  useEffect(() => {
    console.log('SiteDistributionChart data:', data);
  }, [data]);

  if (!data?.length) {
    console.log('No site distribution data available');
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">Site Distribution</h3>
        <div className="h-[200px] w-full flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Define the expected locations and their order
  const locationOrder = ['Columbus', 'Addison', 'Lake City'];

  // Transform data correctly using axisStep and value
  const pieData = locationOrder.map(location => {
    const locationData = data.find(item => item.axisStep === location);
    return {
      name: location, // Use 'name' as expected by PieChart
      value: locationData ? (locationData.value ?? 0) : 0 // Use 'value', default null/undefined to 0
    };
  }).filter(item => item.value > 0); // Keep filtering non-zero values

  console.log('Transformed pie data:', pieData);

  if (!pieData.length) {
    console.log('No non-zero values in site distribution data after transformation');
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">Site Distribution</h3>
        <div className="h-[200px] w-full flex items-center justify-center">
          <p className="text-gray-500">No data values available</p> // Message can remain the same
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Site Distribution</h3>
      <div className="h-[200px] w-full">
        {/* Ensure PieChart component expects 'name' and 'value' keys in its data prop */}
        <PieChart data={pieData} />
      </div>
    </div>
  );
}
