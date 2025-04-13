import { SiteDistributionPoint } from '@/lib/db/types';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

interface SiteDistributionChartProps {
  data: SiteDistributionPoint[];
}

export default function SiteDistributionChart({ data }: SiteDistributionChartProps) {
  // Handle case where data is undefined or empty
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No site distribution data available</div>;
  }
  
  // Define the expected locations and their order
  const locationOrder = ['Columbus', 'Addison', 'Lake City']; // Match exact axisStep values from logs
  
  // Filter and sort data by locations
  const sortedData = locationOrder.map(location => {
    const locationData = data.find(item => item.axisStep === location);
    return locationData || {
      id: `${location}-missing`,
      axisStep: location,
      value: 0,
    };
  });
  
  // Extract labels and data series
  const labels = sortedData.map(item => item.axisStep);
  const values = sortedData.map(item => item.value);

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',  // Columbus
          'rgba(75, 192, 192, 0.6)',  // Addison
          'rgba(255, 206, 86, 0.6)',  // Lake City
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Site Distribution',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toFixed(1)}%`;
          }
        }
      }
    },
  };

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}