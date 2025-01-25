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
        <CardHeader className="p-2">
          <CardTitle className="text-xs">Customer Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newCustomers" stroke="#8884d8" name="New Customers" />
              <Line type="monotone" dataKey="prospects" stroke="#82ca9d" name="Prospects" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}