'use client';

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartDataRow } from '@/lib/db/types';

interface HistoricalDataProps {
  data: ChartDataRow[];
}

export function HistoricalDataChart({ data }: HistoricalDataProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Historical Data</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No data available
        </div>
      </Card>
    );
  }

  // Group by rowId to mirror admin ordering and extract P21/POR values
  const now = new Date();
  const p21Rows = data.filter(item => item.serverName === 'P21').sort((a, b) => parseInt(a.rowId) - parseInt(b.rowId));
  const porRows = data.filter(item => item.serverName === 'POR').sort((a, b) => parseInt(a.rowId) - parseInt(b.rowId));
  const monthsCount = p21Rows.length;
  const chartData = p21Rows.map((r, i) => {
    const offset = i - (monthsCount - 1);
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
      .toLocaleString('default', { month: 'short' });
    return { date, p21: r.value ?? 0, por: porRows[i]?.value ?? 0 };
  });

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Historical Data</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="p21" stroke="#8884d8" name="P21" />
            <Line type="monotone" dataKey="por" stroke="#82ca9d" name="POR" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
