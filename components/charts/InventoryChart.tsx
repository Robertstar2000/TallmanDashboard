'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';
import { InventoryData } from '@/lib/types/admin';

interface InventoryChartProps {
  data: InventoryData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function InventoryChart({ data }: InventoryChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  const chartData = React.useMemo(() => {
    return safeData.map((item) => ({
      name: item.category || '',
      inStock: typeof item.inStock === 'number' ? item.inStock : 0,
      onOrder: typeof item.onOrder === 'number' ? item.onOrder : 0,
    }));
  }, [safeData]);

  return (
    <DataDetailsDialog 
      title="Inventory Details" 
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
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 2, right: 4, left: 0, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                interval={0}
                height={12}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                width={25}
              />
              <Tooltip
                contentStyle={{ fontSize: 12 }}
                labelStyle={{ fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 10 }}
                height={10}
              />
              <Bar dataKey="inStock" fill="#0088FE" name="In Stock" />
              <Bar dataKey="onOrder" fill="#00C49F" name="On Order" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}
