import { PORDailySalesPoint } from '@/lib/db/types';
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

interface POROverviewChartProps {
  data: PORDailySalesPoint[];
}

export default function POROverviewChart({ data }: POROverviewChartProps) {
  // Handle case where data is undefined or empty
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No POR overview data available</div>;
  }
  
  // Build labels and sales series
  const labels = data.map(pt => pt.date);
  const salesData = data.map(pt => pt.value);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Rental Sales',
        data: salesData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.3,
      }
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
        text: 'Rental Sales',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Sales' }
      },
      x: { },
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}