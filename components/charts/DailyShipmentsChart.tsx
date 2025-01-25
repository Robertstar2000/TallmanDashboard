'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';

interface DailyShipmentsChartProps {
  data: any[];
  onUpdate: (data: any[]) => void;
}

export function DailyShipmentsChart({ data, onUpdate }: DailyShipmentsChartProps) {
  return (
    <EditableChart
      title="Daily Shipments"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">Daily Shipments (Last 10 Days)</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{fontSize: 10}} />
              <YAxis tick={{fontSize: 10}} />
              <Tooltip formatter={(value) => value.toLocaleString()} />
              <Legend />
              <Bar dataKey="shipments" fill="#0088FE" name="Shipments" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}