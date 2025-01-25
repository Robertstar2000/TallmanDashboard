'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps<T> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  color: string;
  onDataUpdate?: (data: T[]) => void;
}

export function BarChart<T>({ data, xKey, yKey, color, onDataUpdate }: BarChartProps<T>) {
  const chartData = {
    labels: data.map(item => String(item[xKey])),
    datasets: [
      {
        data: data.map(item => Number(item[yKey])),
        backgroundColor: color,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
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
      <Bar data={chartData} options={options} />
    </div>
  );
}
