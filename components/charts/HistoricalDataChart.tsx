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
  
  // Sort data by month in chronological order
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sortedData = [...data].sort((a, b) => {
    return monthOrder.indexOf(a.date) - monthOrder.indexOf(b.date);
  });
  
  // Reverse the array to have current month on the right
  const reversedData = [...sortedData].reverse();
  
  // Extract labels and data series
  const labels = reversedData.map(item => item.date);
  const p21Data = reversedData.map(item => item.p21 !== undefined ? item.p21 : 0);
  const porData = reversedData.map(item => item.por !== undefined ? item.por : 0);
  const combinedData = reversedData.map(item => item.combined !== undefined ? item.combined : 0);

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