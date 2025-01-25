'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface DailyOrder {
  [key: string]: string | number;
  date: string;
  orders: number;
}

export function DailyOrdersChart({ data }: { data: DailyOrder[] }) {
  return (
    <DataDetailsDialog 
      title="Daily Orders Details" 
      data={data}
      formatValue={(value: string | number) => {
        if (typeof value === 'number') {
          return value.toString();
        }
        return value;
      }}
    >
      <Card className="h-full cursor-pointer hover:bg-accent/10 transition-colors">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Daily Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                height={12}
              />
              <YAxis 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                width={16}
              />
              <Tooltip 
                formatter={(value: number) => [value, 'Orders']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar 
                dataKey="orders" 
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}