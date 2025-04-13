'use client';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export function ArAging({ data }) {
    return (<Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">AR Aging</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="range"/>
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8"/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>);
}
