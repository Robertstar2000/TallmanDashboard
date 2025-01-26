import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DataDetailsDialog } from '@/components/DataDetailsDialog';

interface SiteData {
  [key: string]: string | number;
  name: string;
  value: number;
}

interface SiteDistributionChartProps {
  data: SiteData[];
  onUpdate?: (data: SiteData[]) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function SiteDistributionChart({ data, onUpdate }: SiteDistributionChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const formattedTotal = `$${(total / 1000000).toFixed(1)}M`;

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.2;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#666"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="clamp(7px,0.7vw,8px)"
      >
        {`$${(value / 1000000).toFixed(1)}M`}
      </text>
    );
  };

  return (
    <DataDetailsDialog 
      title="Site Distribution Details" 
      data={data}
      formatValue={(value: string | number) => {
        if (typeof value === 'number') {
          return value.toString();
        }
        return value;
      }}
    >
      <Card className="h-full cursor-pointer hover:bg-accent/10 transition-colors">
        <CardHeader className="p-0.5 h-[14px]">
          <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">Site Distribution</CardTitle>
        </CardHeader>
        <CardContent className="p-0.5 h-[calc(100%-14px)]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 2, right: 8, left: 2, bottom: 2 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={renderCustomizedLabel}
                labelLine={true}
                startAngle={270}
                endAngle={-90}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="clamp(9px,0.9vw,10px)"
                  fontWeight="bold"
                >
                  {formattedTotal}
                </text>
              </Pie>
              <Tooltip formatter={(value) => `$${(value as number).toLocaleString()}`} />
              <Legend
                wrapperStyle={{ fontSize: 'clamp(7px,0.7vw,8px)' }}
                iconSize={4}
                height={10}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DataDetailsDialog>
  );
}