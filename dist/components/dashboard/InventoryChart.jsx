'use client';
import { BarChart } from '@/components/charts/BarChart';
export function InventoryChart({ data }) {
    if (!(data === null || data === void 0 ? void 0 : data.length))
        return null;
    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return (<div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Inventory Overview</h3>
      <div className="h-[200px] w-full">
        <BarChart data={sortedData} xKey="date" yKey="orders" color="#4F46E5" yAxisLabel="Units" xAxisLabel="Month" interval="month"/>
      </div>
    </div>);
}
