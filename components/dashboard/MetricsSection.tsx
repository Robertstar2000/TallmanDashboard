'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';
import { Metric } from '@/lib/types/dashboard';

interface MetricsSectionProps {
  metrics: Metric[];
}

export function MetricsSection({ metrics }: MetricsSectionProps) {
  const getMetricValue = (metric: Metric) => {
    if (metric.name.toLowerCase().includes('revenue') || 
        metric.name.toLowerCase().includes('invoices')) {
      return formatCurrency(metric.value);
    }
    return formatNumber(metric.value);
  };

  return (
    <div className="flex flex-col gap-4">
      {metrics.map((metric) => (
        <Card key={metric.name} className="p-4">
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-500">{metric.name}</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-semibold">{getMetricValue(metric)}</div>
              <div className={`flex items-center text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {metric.trend === 'up' ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : metric.trend === 'down' ? (
                  <ArrowDownIcon className="h-4 w-4" />
                ) : null}
                <span>{Math.abs(metric.change).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}