'use client';

import { PieChart } from '@/components/charts/PieChart';
import { SiteDistributionPoint } from '@/lib/types/dashboard';
import { useEffect } from 'react';

interface SiteDistributionChartProps {
  data: SiteDistributionPoint[];
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

  // Transform data for pie chart to show only Columbus, Addison, and Lake City
  const pieData = [
    { name: 'Columbus', value: data.reduce((sum, item) => sum + (item.columbus || 0), 0) },
    { name: 'Addison', value: data.reduce((sum, item) => sum + (item.addison || 0), 0) },
    { name: 'Lake City', value: data.reduce((sum, item) => sum + (item.lakeCity || 0), 0) }
  ].filter(item => item.value > 0); // Only include non-zero values

  console.log('Transformed pie data:', pieData);

  if (!pieData.length) {
    console.log('No non-zero values in site distribution data');
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">Site Distribution</h3>
        <div className="h-[200px] w-full flex items-center justify-center">
          <p className="text-gray-500">No data values available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Site Distribution</h3>
      <div className="h-[200px] w-full">
        <PieChart data={pieData} />
      </div>
    </div>
  );
}
