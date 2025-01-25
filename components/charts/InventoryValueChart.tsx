'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';

interface InventoryValueChartProps {
  data: any[];
  onUpdate: (data: any[]) => void;
}

export function InventoryValueChart({ data, onUpdate }: InventoryValueChartProps) {
  return (
    <EditableChart
      title="Inventory Value"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">Inventory Value & Turnover</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{fontSize: 10}} />
              <YAxis yAxisId="left" tick={{fontSize: 10}} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
              <Tooltip formatter={(value) => typeof value === 'number' ? 
                value > 1000 ? `$${(value/1000000).toFixed(1)}M` : value.toFixed(1)
              : value} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="value" stroke="#82ca9d" name="Value ($)" />
              <Line yAxisId="right" type="monotone" dataKey="turnover" stroke="#ff7300" name="Turnover Rate" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}