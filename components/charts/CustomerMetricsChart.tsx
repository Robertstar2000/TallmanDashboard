import { CustomerMetricPoint } from '@/lib/db/types';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

interface CustomerMetricsChartProps {
  data: CustomerMetricPoint[];
}

export default function CustomerMetricsChart({ data }: CustomerMetricsChartProps) {
  // Handle case where data is undefined or empty
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No customer metrics available</div>;
  }

  // Format month labels (Jan, Feb, etc.) in data order so current month (last) is rightmost
  const labels = data.map(item => new Date(item.date).toLocaleString('default', { month: 'short' }));
  const newCust = data.map(item => item.newCustomers);
  const retCust = data.map(item => item.returningCustomers || item.returning || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'New Customers',
        data: newCust,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        barPercentage: 0.5,
      },
      {
        label: 'Returning Customers',
        data: retCust,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        barPercentage: 0.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Customer Metrics',
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Month' }
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, stepSize: 1 },
        title: { display: true, text: 'Customers' }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '243px' }}>
      <Bar
        data={chartData}
        options={options}
        height={243}
      />
    </div>
  );
}