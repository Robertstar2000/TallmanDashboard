'use client';

import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WebOrdersProps {
  data: {
    id: string;
    date: string;
    orders: number;
    revenue: number;
  }[];
}

export function WebOrders({ data }: WebOrdersProps) {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Web Orders</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" yAxisId="left" />
            <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" yAxisId="right" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
