'use client';
import { BarChart } from '@/components/charts/BarChart';
import { useEffect } from 'react';
export function ARAgingChart({ data }) {
    useEffect(() => {
        // Add detailed logging for AR Aging data
        console.log('AR Aging Chart received data:', data);
        if (!data || data.length === 0) {
            console.warn('AR Aging Chart: No data received or empty array');
        }
        else {
            console.log(`AR Aging Chart: Received ${data.length} data points`);
            data.forEach((item, index) => {
                console.log(`AR Aging item ${index}:`, JSON.stringify(item));
                if (typeof item.amount !== 'number') {
                    console.warn(`AR Aging item ${index} has non-numeric amount: ${item.amount} (type: ${typeof item.amount})`);
                }
                if (!item.range) {
                    console.warn(`AR Aging item ${index} is missing range property`);
                }
            });
        }
    }, [data]);
    // Ensure data exists and is an array
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.warn('ARAgingChart: Invalid or empty data');
        return (<div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium mb-2">AR Aging</h3>
        <div className="h-[200px] w-full flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>);
    }
    // Ensure all data points have numeric amounts
    const validData = data.map(item => (Object.assign(Object.assign({}, item), { amount: typeof item.amount === 'number' ? item.amount : 0 })));
    return (<div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">AR Aging</h3>
      <div className="h-[200px] w-full">
        <BarChart data={validData} xKey="range" yKey="amount" color="#4F46E5" yAxisLabel="Amount ($)" xAxisLabel="Age Range"/>
      </div>
    </div>);
}
