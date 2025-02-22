'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminVariable } from '@/lib/types/dashboard';

interface ChartData {
  date: string;
  displayDate: string;
  orders: number;
  revenue: number;
}

interface WebMetricsChartProps {
  variables: AdminVariable[];
}

export function WebMetricsChart({ variables }: WebMetricsChartProps) {
  const processData = (data: AdminVariable[]): ChartData[] => {
    const metrics = data.filter(v => v.chartGroup === 'Web Metrics');
    const dates = Array.from(new Set(metrics.map(v => v.name).filter((name): name is string => name !== undefined))).sort();
    
    return dates.map(date => {
      const monthMetrics = metrics.filter(v => v.name === date);
      const result = {
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        orders: 0,
        revenue: 0
      };

      monthMetrics.forEach(metric => {
        if (metric.subGroup === 'Orders') {
          result.orders = metric.value;
        } else if (metric.subGroup === 'Revenue') {
          result.revenue = metric.value;
        }
      });

      return result;
    });
  };

  const chartData = processData(variables);

  // Calculate max values for dynamic Y-axis domains
  const maxOrders = Math.max(...chartData.map(d => d.orders));
  const maxRevenue = Math.max(...chartData.map(d => d.revenue));

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'Revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return value.toLocaleString();
  };

  return (
    <Card className="h-[200px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Web Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="displayDate"
                tick={{ fill: '#666', fontSize: 12 }}
                tickLine={{ stroke: '#666' }}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
              />
              <YAxis
                yAxisId="orders"
                domain={[0, maxOrders * 1.2]}
                tick={{ fill: '#666', fontSize: 12 }}
                tickLine={{ stroke: '#666' }}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(value)
                }
              />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                domain={[0, maxRevenue * 1.2]}
                tick={{ fill: '#666', fontSize: 12 }}
                tickLine={{ stroke: '#666' }}
                axisLine={{ stroke: '#666', strokeWidth: 1 }}
                tickFormatter={(value) => 
                  new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    notation: 'compact',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value)
                }
              />
              <Tooltip
                formatter={formatTooltipValue}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Legend 
                wrapperStyle={{ 
                  fontSize: '12px',
                  paddingTop: '4px'
                }}
              />
              <Line 
                yAxisId="orders"
                type="monotone" 
                dataKey="orders" 
                name="Orders" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <Line 
                yAxisId="revenue"
                type="monotone" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
