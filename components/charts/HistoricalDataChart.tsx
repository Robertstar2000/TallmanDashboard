import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface HistoricalData {
  [key: string]: string | number;
  month: string;
  p21: number;
  por: number;
  total: number;
}

interface HistoricalDataChartProps {
  data: HistoricalData[];
}

const COLORS = {
  p21: '#8884d8',
  por: '#82ca9d',
  total: '#ffc658'
};

export function HistoricalDataChart({ data = [] }: HistoricalDataChartProps) {
  const formatYAxis = (value: number) => {
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  const formatTooltip = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <DataDetailsDialog 
      title="Historical Data Details" 
      data={data}
      formatValue={(value: string | number) => {
        if (typeof value === 'number') {
          return `$${value.toLocaleString()}`;
        }
        return value;
      }}
    >
      <Card className="h-full cursor-pointer hover:bg-accent/10 transition-colors">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Historical Data</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 2, right: 16, left: 0, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis 
                dataKey="month" 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                height={12}
                interval={2}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                width={35}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                contentStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
              />
              <Legend
                wrapperStyle={{ fontSize: 'clamp(7px,0.7vw,8px)' }}
                iconSize={4}
                height={10}
              />
              <Line 
                type="monotone" 
                dataKey="p21" 
                stroke={COLORS.p21}
                name="P21"
                dot={false}
                strokeWidth={1}
              />
              <Line 
                type="monotone" 
                dataKey="por" 
                stroke={COLORS.por}
                name="POR"
                dot={false}
                strokeWidth={1}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke={COLORS.total}
                name="Total"
                dot={false}
                strokeWidth={1}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}
