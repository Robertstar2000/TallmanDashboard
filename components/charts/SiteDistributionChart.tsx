'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EditableChart } from './EditableChart';
import { formatCurrency } from '@/lib/utils/formatting';
import { SiteDistribution } from '@/lib/types/dashboard';

interface SiteDistributionChartProps {
  data: SiteDistribution[];
  onUpdate: (data: SiteDistribution[]) => void;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-background border rounded p-2 shadow-lg">
        <p className="text-xs font-semibold">{name}</p>
        <p className="text-xs">Value: {formatCurrency(value)}</p>
      </div>
    );
  }
  return null;
};

export function SiteDistributionChart({ data, onUpdate }: SiteDistributionChartProps) {
  // Transform data for pie chart
  const pieData = data.length > 0 ? [
    { name: 'Columbus', value: data[0].columbus },
    { name: 'Addison', value: data[0].addison },
    { name: 'Lake City', value: data[0].lakeCity }
  ] : [];

  return (
    <EditableChart
      title="Site Distribution"
      data={data}
      onUpdate={onUpdate}
    >
      <Card className="h-full">
        <CardHeader className="p-1">
          <CardTitle className="text-xs">Site Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-1 h-[calc(100%-2rem)]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={(entry) => entry.name}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </EditableChart>
  );
}