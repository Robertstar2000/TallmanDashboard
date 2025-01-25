import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ResponsiveContainer } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface AccountsPayableChartProps {
  data: {
    month: string;
    payable: number;
    overdue: number;
    receivable: number;
  }[];
}

export function AccountsPayableChart({ data }: AccountsPayableChartProps) {
  console.log('AccountsPayableChart data:', data);
  return (
    <DataDetailsDialog 
      title="Accounts Payable Details" 
      data={data}
      formatValue={(value: string | number) => {
        if (typeof value === 'number') {
          return `$${value.toLocaleString()}`;
        }
        return value;
      }}
    >
      <Card className="h-full">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis dataKey="month" tick={{fontSize: 'clamp(7px,0.7vw,8px)'}} height={12} />
              <YAxis 
                yAxisId="left"
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                width={16}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                width={16}
              />
              <Tooltip />
              <Legend 
                wrapperStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                iconSize={4}
                height={10}
              />
              <Area yAxisId="left" type="monotone" dataKey="payable" fill="#8884d8" stroke="#8884d8" />
              <Area yAxisId="left" type="monotone" dataKey="overdue" fill="#82ca9d" stroke="#82ca9d" />
              <Line yAxisId="right" type="monotone" dataKey="receivable" stroke="#ff7300" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}