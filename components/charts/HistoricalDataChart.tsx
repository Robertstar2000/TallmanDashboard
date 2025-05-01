import { HistoricalDataPoint } from '@/lib/db/types';
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

interface HistoricalDataChartProps {
  data: HistoricalDataPoint[];
}

export default function HistoricalDataChart({ data }: HistoricalDataChartProps) {
  // Handle case where data is undefined or empty
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No historical data available</div>;
  }
  
  // Build previous 11 months through current month as labels (ascending)
  const now = new Date();
  const offsets = Array.from({ length: 12 }, (_, i) => i - 11);
  const labels = offsets.map(off =>
    new Date(now.getFullYear(), now.getMonth() + off, 1)
      .toLocaleString('default', { month: 'short' })
  );
  const dataMap = data.reduce((acc, item) => {
    acc[item.date] = item;
    return acc;
  }, {} as Record<string, HistoricalDataPoint>);
  const p21Data = labels.map(label => dataMap[label]?.p21 ?? 0);
  const porData = labels.map(label => dataMap[label]?.por ?? 0);
  const combinedData = labels.map(label => dataMap[label]?.combined ?? 0);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'P21',
        data: p21Data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'POR',
        data: porData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Combined',
        data: combinedData,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Historical Data',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}