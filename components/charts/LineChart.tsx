'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  Scale,
  CoreScaleOptions,
  Tick
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineConfig {
  key: string;
  name: string;
  color: string;
}

interface LineChartProps<T> {
  data: T[];
  xKey: keyof T;
  lines: LineConfig[];
  yAxisLabel?: string;
  xAxisLabel?: string;
  interval?: 'year' | 'month' | 'week' | 'day';
  onDataUpdate?: (data: T[]) => void;
}

export function LineChart<T>({ 
  data, 
  xKey, 
  lines, 
  yAxisLabel = 'Value', 
  xAxisLabel = 'Date',
  interval = 'month',
  onDataUpdate 
}: LineChartProps<T>) {
  const formatLabel = (value: string) => {
    if (!value.includes('-')) return value;
    
    const date = new Date(value);
    switch (interval) {
      case 'year':
        return date.getFullYear().toString();
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      case 'week':
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return value;
    }
  };

  const chartData: ChartData<'line'> = {
    labels: data.map(item => formatLabel(String(item[xKey]))),
    datasets: lines.map(line => ({
      label: line.name,
      data: data.map(item => Number(item[line.key as keyof T])),
      borderColor: line.color,
      backgroundColor: line.color,
      tension: 0.1
    }))
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 8,
          font: {
            size: 11
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            size: 11,
            weight: 'bold' as const
          }
        },
        ticks: {
          font: {
            size: 10
          },
          callback: function(
            this: Scale<CoreScaleOptions>,
            tickValue: number | string,
            index: number,
            ticks: Tick[]
          ) {
            const value = Number(tickValue);
            if (yAxisLabel.includes('$') && value >= 1000) {
              return '$' + (value / 1000).toFixed(1) + 'k';
            }
            return value;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          font: {
            size: 11,
            weight: 'bold' as const
          }
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: false
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
