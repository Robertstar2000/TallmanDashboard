import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ChartDataRow } from '@/lib/db/types'; 

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AccountsChartProps {
  data: ChartDataRow[]; 
}

const getMonthIndex = (axisStep: string): number => {
  const match = axisStep.match(/Month (\d+)/);
  return match ? parseInt(match[1], 10) - 1 : -1;
};

export default function AccountsChart({ data }: AccountsChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No accounts data available</div>;
  }

  // Filter out items with null axisStep before processing
  const filteredData = data.filter(item => {
    if (item.axisStep === null) {
      console.warn('Filtering out accounts data item with null axisStep:', item);
      return false;
    }
    return true;
  });

  const groupedData = filteredData.reduce((acc, item) => {
    // Add null check again here to satisfy TypeScript
    if (item.axisStep === null) {
      // This case should logically not be hit due to the filter above, but satisfies TS
      return acc; 
    }
    const monthIndex = getMonthIndex(item.axisStep); // Now definitely safe
    if (monthIndex === -1) {
      console.warn('Skipping item with invalid month format in axisStep:', item);
      return acc; // Skip if month format is wrong
    }
    if (!acc[monthIndex]) {
      acc[monthIndex] = {};
    }
    acc[monthIndex][item.variableName] = item.value ?? 0;
    return acc;
  }, {} as { [monthIndex: number]: { [variableName: string]: number } });

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const payableData = monthLabels.map((_, index) => groupedData[index]?.['accounts_payable'] ?? 0);
  const receivableData = monthLabels.map((_, index) => groupedData[index]?.['accounts_receivable'] ?? 0);
  const overdueData = monthLabels.map((_, index) => groupedData[index]?.['accounts_overdue'] ?? 0); 

  const chartData = {
    labels: monthLabels, 
    datasets: [
      {
        label: 'Payable',
        data: payableData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Receivable',
        data: receivableData,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Overdue',
        data: overdueData,
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
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
        text: 'Accounts',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (typeof value === 'number') {
              return '$' + value.toLocaleString();
            }
            return value;
          }
        }
      }
    }
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
