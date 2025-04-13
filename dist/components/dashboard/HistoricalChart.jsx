'use client';
import { LineChart } from '@/components/charts/LineChart';
export function HistoricalChart({ data }) {
    if (!(data === null || data === void 0 ? void 0 : data.length))
        return null;
    return (<div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium mb-2">Historical Data</h3>
      <div className="h-[200px] w-full">
        <LineChart data={data} xKey="date" lines={[
            { key: 'p21', name: 'P21', color: '#EC4899' },
            { key: 'por', name: 'POR', color: '#8B5CF6' }
        ]} yAxisLabel="Value" xAxisLabel="Month" interval="month"/>
      </div>
    </div>);
}
