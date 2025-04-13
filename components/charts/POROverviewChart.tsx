import { POROverviewPoint } from '@/lib/db/types';
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
  data: POROverviewPoint[];
}

export default function POROverviewChart({ data }: POROverviewChartProps) {
  // Handle case where data is undefined or empty
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No POR overview data available</div>;
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
  const newRentalsData = reversedData.map(item => item.newRentals);
  const openRentalsData = reversedData.map(item => item.openRentals);
  const rentalValueData = reversedData.map(item => item.rentalValue);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'New Rentals',
        data: newRentalsData,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Open Rentals',
        data: openRentalsData,
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        tension: 0.3,
      },
      {
        label: 'Rental Value',
        data: rentalValueData,
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        tension: 0.3,
        yAxisID: 'y1',
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
        text: 'POR Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Rentals Count'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Rental Value ($)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
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