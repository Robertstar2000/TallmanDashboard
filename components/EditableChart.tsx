import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface EditableChartProps {
  title: string;
  data?: {
    name: string;
    value: number;
  }[];
  onUpdate?: (data: any[]) => void;
  children: React.ReactNode;
}

const defaultData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
];

export function EditableChart({ title, data = defaultData, onUpdate, children }: EditableChartProps) {
  return (
    <Card className="h-full">
      <CardHeader className="p-0.5 h-[14px]">
        <CardTitle className="text-[clamp(0.45rem,0.7vw,0.6rem)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0.5 h-[calc(100%-14px)]">
        {children}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 2, right: 8, left: 2, bottom: 2 }}
          >
            <CartesianGrid strokeDasharray="2 2" />
            <XAxis 
              dataKey="name" 
              tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
              height={12}
            />
            <YAxis
              tick={{fontSize: 'clamp(7px,0.7vw,8px)'}}
              width={16}
            />
            <Tooltip />
            <Legend
              wrapperStyle={{ fontSize: 'clamp(7px,0.7vw,8px)' }}
              iconSize={4}
              height={10}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}