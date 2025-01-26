'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface AgingBucket {
  range: string;
  amount: number;
  color: string;
}

interface ARAgingChartProps {
  data: AgingBucket[];
}

const COLORS = {
  '1-30': '#4CAF50',   // Green for current
  '31-60': '#FFC107',  // Yellow for getting attention
  '61-90': '#FF9800',  // Orange for concerning
  '90+': '#F44336'     // Red for critical
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function ARAgingChart({ data }: ARAgingChartProps) {
  return (
    <DataDetailsDialog
      title="AR Aging Details"
      data={data}
      formatValue={(value: any) => {
        if (typeof value === 'number') {
          return formatCurrency(value);
        }
        return value;
      }}
    >
      <Card className="h-full">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">AR Aging</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 8 }}
              />
              <YAxis
                tickFormatter={(value) => `$${value/1000}k`}
                tick={{ fontSize: 8 }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ fontSize: 10 }}
                contentStyle={{ fontSize: 10 }}
              />
              <Legend wrapperStyle={{ fontSize: 8 }} />
              <Bar
                dataKey="amount"
                fill="#8884d8"
                name="Amount Due"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}
