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
  Legend
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
  onDataUpdate?: (data: T[]) => void;
}

export function LineChart<T>({ data, xKey, lines, onDataUpdate }: LineChartProps<T>) {
  const chartData = {
    labels: data.map(item => String(item[xKey])),
    datasets: lines.map(line => ({
      label: line.name,
      data: data.map(item => Number(item[line.key as keyof T])),
      borderColor: line.color,
      backgroundColor: line.color,
      tension: 0.1
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="h-full w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
