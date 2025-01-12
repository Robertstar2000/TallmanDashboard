'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';
import { AccountsPayableData } from '@/lib/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatting';

interface AccountsPayableChartProps {
  data: AccountsPayableData[];
  onUpdate: (data: AccountsPayableData[]) => void;
}

export function AccountsPayableChart({ data, onUpdate }: AccountsPayableChartProps) {
  return (
    <EditableChart
      title="Accounts Payable"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">Accounts Payable Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10}}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis 
                tick={{fontSize: 10}}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="total" 
                stackId="1" 
                stroke="hsl(var(--chart-1))" 
                fill="hsl(var(--chart-1))" 
                name="Total Payable" 
              />
              <Area 
                type="monotone" 
                dataKey="overdue" 
                stackId="2" 
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                name="Overdue Amount" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}