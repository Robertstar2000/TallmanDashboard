'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';
import { CustomerData } from '@/lib/types/dashboard';

interface CustomersChartProps {
  data: CustomerData[];
  onUpdate: (data: CustomerData[]) => void;
}

const CustomTooltip = ({ active, payload, label, allData }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-2 shadow-lg min-w-[200px]">
        <div className="mb-2 border-b pb-1">
          <p className="text-xs font-semibold">Selected Month:</p>
          <p className="text-xs">{new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <p className="text-xs">New: {payload[0].value}</p>
          <p className="text-xs">Prospects: {payload[1].value}</p>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Last 12 Months:</p>
          <div className="max-h-[200px] overflow-y-auto">
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold mb-1">
              <span>Month</span>
              <span>New</span>
              <span>Prospects</span>
            </div>
            {allData.map((item: CustomerData) => (
              <div key={item.date} className="text-xs mb-1">
                <div className="grid grid-cols-3 gap-2">
                  <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                  <span>{item.new}</span>
                  <span>{item.prospects}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CustomersChart({ data, onUpdate }: CustomersChartProps) {
  return (
    <EditableChart
      title="Customers Overview"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">New Customers vs. Prospects</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10}}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis 
                tick={{fontSize: 10}}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} allData={data} />} />
              <Legend />
              <Line type="monotone" dataKey="new" stroke="hsl(var(--chart-1))" name="New Customers" />
              <Line type="monotone" dataKey="prospects" stroke="hsl(var(--chart-2))" name="Prospects" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}
