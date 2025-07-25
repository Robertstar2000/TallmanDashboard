import { ChartDataRow } from '@/lib/db/types';
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

interface DailyOrdersChartProps {
  data: ChartDataRow[];
}

export default function DailyOrdersChart({ data }: DailyOrdersChartProps) {
  // Handle case where data is undefined or empty
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No daily orders data available</div>;
  }
  
  // Define the expected day order (oldest to newest)
  const dayOrder = ['6 Days Ago', '5 Days Ago', '4 Days Ago', '3 Days Ago', '2 Days Ago', 'Yesterday', 'Today'];
  
  // Map ChartDataRow entries to date/orders points
  const sorted = dayOrder.map(day => {
    const row = data.find(d => d.axisStep === day);
    return { date: day, orders: row?.value ?? 0 };
  });
  
  // Extract labels and data series
  const labels = sorted.map(pt => pt.date);
  const ordersData = sorted.map(pt => pt.orders);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Orders',
        data: ordersData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
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
        text: 'Daily Orders',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}