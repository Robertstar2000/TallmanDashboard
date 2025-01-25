'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPOR, updatePOR } from '@/lib/db';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface PORData {
  [key: string]: string | number;
  month: string;
  newRentals: number;
  openRentals: number;
  rentalValue: number;
}

interface PORChartProps {
  data: PORData[];
}

const COLORS = {
  newRentals: '#8884d8',
  openRentals: '#82ca9d',
  rentalValue: '#ffc658'
};

export function PORChart({ data }: { data: PORData[] }) {
  return (
    <DataDetailsDialog
      title="POR Details"
      data={data}
      formatValue={(value: string | number) => {
        if (typeof value === 'number') {
          return value.toString();
        }
        return value;
      }}
    >
      <Card className="h-full">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">POR Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
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
                formatter={(value: number) => `$${value.toLocaleString()}`}
                labelStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                contentStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
              />
              <Legend
                wrapperStyle={{ fontSize: 'clamp(7px,0.7vw,8px)' }}
                iconSize={4}
                height={10}
              />
              <Bar yAxisId="left" dataKey="newRentals" fill="#8884d8" name="New Rentals" />
              <Bar yAxisId="left" dataKey="openRentals" fill="#82ca9d" name="Open Rentals" />
              <Line yAxisId="right" type="monotone" dataKey="rentalValue" stroke="#ff7300" name="Rental Value" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}
