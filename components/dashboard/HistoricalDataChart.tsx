'use client';

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HistoricalDataProps {
  data: {
    id: string;
    date: string;
    p21: number;
    por: number;
  }[];
}

export function HistoricalDataChart({ data }: HistoricalDataProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Historical Data</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
