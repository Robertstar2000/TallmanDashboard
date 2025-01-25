'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface WebMetricData {
  [key: string]: string | number;
  month: string;
  W_Orders: number;
  W_Revenue: number;
}

interface WebMetricsChartProps {
  data?: WebMetricData[];
}

const COLORS = {
  W_Orders: '#8884d8',
  W_Revenue: '#82ca9d'
};

const defaultData: WebMetricData[] = [
  { month: 'Jan', W_Orders: 245, W_Revenue: 125000 },
  { month: 'Feb', W_Orders: 362, W_Revenue: 148000 },
  { month: 'Mar', W_Orders: 456, W_Revenue: 195000 },
  { month: 'Apr', W_Orders: 478, W_Revenue: 242000 },
  { month: 'May', W_Orders: 585, W_Revenue: 286000 },
  { month: 'Jun', W_Orders: 692, W_Revenue: 345000 },
  { month: 'Jul', W_Orders: 800, W_Revenue: 400000 },
  { month: 'Aug', W_Orders: 900, W_Revenue: 450000 },
  { month: 'Sep', W_Orders: 1000, W_Revenue: 500000 },
  { month: 'Oct', W_Orders: 1100, W_Revenue: 550000 },
  { month: 'Nov', W_Orders: 1200, W_Revenue: 600000 },
  { month: 'Dec', W_Orders: 1300, W_Revenue: 650000 }
];

export function Web_Metrics_Chart({ data = defaultData }: WebMetricsChartProps) {
  const safeData = Array.isArray(data) ? data : defaultData;

  return (
    <DataDetailsDialog 
      title="Web Orders Details" 
      data={safeData}
      formatValue={(value: string | number) => {
        if (typeof value === 'number') {
          return value.toString();
        }
        return value;
      }}
    >
      <Card className="h-full cursor-pointer hover:bg-accent/10 transition-colors">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Web Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={safeData}
              margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis 
                dataKey="month" 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                height={12}
                interval={2}
              />
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
              <Tooltip 
                formatter={(value, name) => {
                  if (name === "W_Revenue") {
                    return [`$${Number(value).toLocaleString()}`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 'clamp(7px,0.7vw,8px)' }}
                iconSize={4}
                height={10}
              />
              <Bar yAxisId="left" dataKey="W_Orders" fill={COLORS.W_Orders} name="Orders" />
              <Line yAxisId="right" type="monotone" dataKey="W_Revenue" stroke={COLORS.W_Revenue} name="Revenue" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}