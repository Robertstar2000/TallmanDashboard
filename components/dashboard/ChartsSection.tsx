'use client';

import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useEffect } from 'react';
import { DailyOrdersChart } from './DailyOrdersChart';
import { 
  HistoricalDataPoint, 
  AccountsDataPoint, 
  CustomerMetricPoint, 
  InventoryDataPoint, 
  POROverviewPoint, 
  SiteDistributionPoint, 
  ARAgingPoint, 
  DailyOrderPoint, 
  WebOrderPoint 
} from '@/lib/db/types';

interface ChartsSectionProps {
  data: {
    historicalData: HistoricalDataPoint[];
    accounts: AccountsDataPoint[];
    customerMetrics: CustomerMetricPoint[];
    inventory: InventoryDataPoint[];
    porOverview: POROverviewPoint[];
    siteDistribution: SiteDistributionPoint[];
    arAging: ARAgingPoint[];
    dailyOrders: DailyOrderPoint[];
    webOrders: WebOrderPoint[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function ChartsSection({ data }: ChartsSectionProps) {
  console.log('Accounts data in ChartsSection:', data.accounts);
  console.log('Web Orders data in ChartsSection:', data.webOrders);
  console.log('Daily Orders data in ChartsSection:', data.dailyOrders);

  useEffect(() => {
    console.log('Web Orders data details:');
    if (data.webOrders && data.webOrders.length > 0) {
      data.webOrders.forEach((point, index) => {
        console.log(`Point ${index}: date=${point.date}, orders=${point.orders}, revenue=${point.revenue}`);
      });
    } else {
      console.log('No Web Orders data available');
    }
    
    console.log('Daily Orders data details:');
    if (data.dailyOrders && data.dailyOrders.length > 0) {
      data.dailyOrders.forEach((point, index) => {
        console.log(`Point ${index}: date=${point.date}, orders=${point.orders}`);
      });
    } else {
      console.log('No Daily Orders data available');
    }

    console.log('AR Aging data details:');
    if (data.arAging && data.arAging.length > 0) {
      console.log(`AR Aging has ${data.arAging.length} data points`);
      data.arAging.forEach((point, index) => {
        console.log(`Point ${index}: range=${point.range}, amount=${point.amount}, type=${typeof point.amount}`);
      });
    } else {
      console.log('No AR Aging data available');
    }
  }, [data.webOrders, data.dailyOrders, data.arAging]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Accounts Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Accounts</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.accounts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
              padding={{ left: 10, right: 10 }}
              tickFormatter={(value, index) => value}
              reversed={false}
            />
            <YAxis 
              domain={[0, 'dataMax']} 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            {Object.keys(data.accounts[0] || {}).filter(key => key !== 'id' && key !== 'date').map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                stroke={COLORS[idx % COLORS.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Historical Data Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Historical Data</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.historicalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(value, index) => value}
              reversed={false}
            />
            <YAxis 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            {Object.keys(data.historicalData[0] || {}).filter(key => key !== 'id' && key !== 'date').map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                stroke={COLORS[idx % COLORS.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Customer Metrics */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Customer Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.customerMetrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tickFormatter={(value, index) => value}
              reversed={false}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data.customerMetrics[0] || {}).filter(key => key !== 'id' && key !== 'date').map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                fill={COLORS[idx % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Inventory Chart */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Inventory</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.inventory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="department"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data.inventory[0] || {}).filter(key => key !== 'id' && key !== 'department').map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                fill={COLORS[idx % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* POR Overview */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">POR Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.porOverview}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(data.porOverview[0] || {}).filter(key => key !== 'id' && key !== 'date').map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                stroke={COLORS[idx % COLORS.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Site Distribution */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Site Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.siteDistribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent, ...entry }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.siteDistribution.map((entry, index) => (
                <Cell key={entry.id || entry.name || `cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => Number(value).toLocaleString()} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* AR Aging */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">AR Aging</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.arAging}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            {Object.keys(data.arAging[0] || {}).filter(key => key !== 'id' && key !== 'range').map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                fill={COLORS[idx % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="col-span-1">
        <DailyOrdersChart data={data.dailyOrders} />
      </div>

      {/* Web Orders */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Web Orders</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.webOrders}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left" 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value, name) => name === 'revenue' ? `$${Number(value).toLocaleString()}` : value} />
            <Legend />
            {Object.keys(data.webOrders[0] || {}).filter(key => key !== 'id' && key !== 'date').map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                stroke={COLORS[idx % COLORS.length]}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}