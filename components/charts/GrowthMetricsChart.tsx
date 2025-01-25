'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';
import { HistoricalDataPoint } from '@/lib/types/dashboard';

interface GrowthMetricsChartProps {
  data: HistoricalDataPoint[];
  onUpdate: (data: HistoricalDataPoint[]) => void;
}

export function GrowthMetricsChart({ data, onUpdate }: GrowthMetricsChartProps) {
  return (
    <EditableChart
      title="Growth Metrics"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">New Customers vs. New Prospects</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{fontSize: 10}}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleString('default', { month: 'short' });
                }}
              />
              <YAxis tick={{fontSize: 10}} />
              <Tooltip 
                formatter={(value: number) => [value, '']}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
                }}
              />
              <Legend />
              <Bar 
                dataKey="newCustomers" 
                fill="hsl(var(--chart-1))" 
                name="New Customers" 
              />
              <Bar 
                dataKey="newProspects" 
                fill="hsl(var(--chart-2))" 
                name="New Prospects" 
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}