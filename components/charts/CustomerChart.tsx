'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface CustomerMetric {
  [key: string]: string | number;
  month: string;
  newCustomers: number;
  prospects: number;
}

export function CustomerChart({ data }: { data: CustomerMetric[] }) {
  return (
    <DataDetailsDialog
      title="Customer Details"
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
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Customer Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
            >
              <CartesianGrid strokeDasharray="2 2" />
              <XAxis 
                dataKey="month" 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                height={12}
              />
              <YAxis 
                tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                width={16}
              />
              <Tooltip />
              <Legend 
                wrapperStyle={{fontSize: 'clamp(7px,0.7vw,8px)'}}
                iconSize={4}
                height={10}
              />
              <Line type="monotone" dataKey="newCustomers" stroke="#8884d8" name="New Customers" />
              <Line type="monotone" dataKey="prospects" stroke="#82ca9d" name="Prospects" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}