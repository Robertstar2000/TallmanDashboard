import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
  data: { name: string; value: number }[];
}

export function DonutChart({ data }: DonutChartProps) {
  // Add default values if all are zero
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Distribution',
        data: data.map(item => Number(item.value) || 33.33), // Default to equal distribution if zero
        backgroundColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 206, 86)',
          'rgb(255, 99, 132)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
