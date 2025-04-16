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
              yAxisId="left" 
              domain={[0, 'dataMax']} 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 'dataMax']} 
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="payable"
              name="Payable"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="receivable"
              name="Receivable"
              stroke="#82ca9d"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="overdue"
              name="Overdue"
              stroke="#ffc658"
              activeDot={{ r: 8 }}
            />
            {/* Add the Amount Due line if available */}
            {data.accounts.some(item => item.amountDue !== undefined) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="amountDue"
                name="Amount Due"
                stroke="#ff7300"
                activeDot={{ r: 8 }}
              />
            )}
            {/* Add the Current line if available */}
            {data.accounts.some(item => item.current !== undefined) && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="current"
                name="Current"
                stroke="#0088FE"
                activeDot={{ r: 8 }}
              />
            )}
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
            <Line type="monotone" dataKey="sales" name="P21" stroke="#8884d8" />
            <Line type="monotone" dataKey="orders" name="POR" stroke="#82ca9d" />
            <Line type="monotone" dataKey="combined" name="Combined" stroke="#ffc658" />
            <Line type="monotone" dataKey="value1" name="Value 1" stroke="#FF0000" />
            <Line type="monotone" dataKey="value2" name="Value 2" stroke="#0088FE" />
            <Line type="monotone" dataKey="value3" name="Value 3" stroke="#00C49F" />
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
            <Bar dataKey="newCustomers" name="New Customers" fill="#8884d8" />
            <Bar dataKey="returning" name="Returning Customers" fill="#82ca9d" />
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
            <Bar dataKey="inStock" name="In Stock" fill="#8884d8" />
            <Bar dataKey="onOrder" name="On Order" fill="#82ca9d" />
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
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="newRentals" name="New Rentals" stroke="#8884d8" />
            <Line yAxisId="left" type="monotone" dataKey="openRentals" name="Open Rentals" stroke="#82ca9d" />
            <Line yAxisId="right" type="monotone" dataKey="rentalValue" name="Rental Value" stroke="#ffc658" />
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
            <Bar dataKey="amount" fill="#8884d8">
              {data.arAging.map((entry, index) => (
                <Cell key={entry.id || entry.range || `cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
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
            <Line yAxisId="left" type="monotone" dataKey="orders" name="Orders" stroke="#8884d8" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}