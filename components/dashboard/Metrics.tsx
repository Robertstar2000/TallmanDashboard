'use client';

import { Card, CardContent } from "@/components/ui/card";
import { MetricItem } from "@/lib/types/dashboard";

export interface MetricsProps {
  data: MetricItem[];
}

export function Metrics({ data }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((metric) => (
        <Card key={metric.id}>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                {metric.name}
              </p>
              <p 
                className="text-2xl font-bold"
                style={{ color: metric.color }}
              >
                {metric.value}
              </p>
              {metric.trend && (
                <p className={`text-sm ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  {metric.change && ` ${metric.change}%`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
