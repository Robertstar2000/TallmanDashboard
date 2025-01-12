'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';
import { formatCurrency } from '@/lib/utils/formatting';
import { HistoricalDataPoint } from '@/lib/types/dashboard';

interface HistoricalTrendsChartProps {
  data: HistoricalDataPoint[];
  onUpdate: (data: HistoricalDataPoint[]) => void;
}

const CustomTooltip = ({ active, payload, label, allData }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded p-2 shadow-lg min-w-[200px]">
        <div className="mb-2 border-b pb-1">
          <p className="text-xs font-semibold">Selected Month:</p>
          <p className="text-xs">{new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          <p className="text-xs">P21: {formatCurrency(payload[0].value)}</p>
          <p className="text-xs">POR: {formatCurrency(payload[1].value)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold mb-1">Last 12 Months:</p>
          <div className="max-h-[200px] overflow-y-auto">
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold mb-1">
              <span>Month</span>
              <span>P21</span>
              <span>POR</span>
            </div>
            {allData.map((item: HistoricalDataPoint) => (
              <div key={item.date} className="text-xs mb-1">
                <div className="grid grid-cols-3 gap-2">
                  <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                  <span>{formatCurrency(item.p21)}</span>
                  <span>{formatCurrency(item.por)}</span>
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

export function HistoricalTrendsChart({ data, onUpdate }: HistoricalTrendsChartProps) {
  return (
    <EditableChart
      title="Historical Trends"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">Historical P21 & POR Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10}}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis 
                tick={{fontSize: 10}}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} allData={data} />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="p21" 
                stackId="1" 
                stroke="hsl(var(--chart-1))" 
                fill="hsl(var(--chart-1))" 
                name="P21" 
              />
              <Area 
                type="monotone" 
                dataKey="por" 
                stackId="2" 
                stroke="hsl(var(--chart-2))" 
                fill="hsl(var(--chart-2))" 
                name="POR" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}