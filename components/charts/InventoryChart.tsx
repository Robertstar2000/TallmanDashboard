'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface InventoryData {
  [key: string]: string | number;
  category: string;
  inStock: number;
  onOrder: number;
}

interface InventoryChartProps {
  data: InventoryData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const inventoryData = [
  {
    category: '100',
    inStock: 45,
    onOrder: 10,
  },
  {
    category: '101',
    inStock: 62,
    onOrder: 15,
  },
  {
    category: '102',
    inStock: 78,
    onOrder: 20,
  },
  {
    category: '107',
    inStock: 53,
    onOrder: 12,
  }
];

export function InventoryChart({ data }: InventoryChartProps) {
  const safeData = Array.isArray(data) ? data : [];

  const chartData = React.useMemo(() => {
    return safeData.filter(item => item.category !== '108' && item.category !== '109').map((item) => ({
      name: item.category,
      inStock: item.inStock,
      onOrder: item.onOrder,
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
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis 
                dataKey="name"
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                height={12}
              />
              <YAxis 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                width={14}
              />
              <Tooltip />
              <Legend 
                wrapperStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                iconSize={4}
                height={10}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              />
              <Bar dataKey="inStock" fill="#8884d8" />
              <Bar dataKey="onOrder" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}
