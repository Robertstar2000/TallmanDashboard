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

  const transformedData = data.reduce((acc, item) => {
    const date = item.axisStep;
    
    // Skip items with null axisStep (date)
    if (date === null) {
      console.warn('Skipping historical data item with null axisStep:', item);
      return acc;
    }

    const server = item.serverName.toLowerCase();
    const value = item.value ?? 0;

    if (!acc[date]) {
      acc[date] = { date: date, p21: 0, por: 0 };
    }

    if (server === 'p21') {
      acc[date].p21 = value;
    } else if (server === 'por') {
      acc[date].por = value;
    }

    return acc;
  }, {} as { [date: string]: { date: string; p21: number; por: number } });

  const chartData = Object.values(transformedData);

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
