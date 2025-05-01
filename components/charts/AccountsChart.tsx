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

// Parse axisStep offset robustly, allowing optional spaces like "Month - 11"
const getOffset = (axisStep: string): number => {
  const lower = axisStep.toLowerCase().trim();
  if (lower === 'current') return 0;
  // Remove the word "month" and any non-digit/non-minus chars, then parse
  const cleaned = lower.replace(/month/i, '').replace(/[^-\d]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? NaN : num;
};

export default function AccountsChart({ data }: AccountsChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">No accounts data available</div>;
  }

  // Keep only rows with defined axisStep
  const filteredData = data.filter(item => item.axisStep != null);

  // Group data by parsed offset
  const groupedData = filteredData.reduce((acc, item) => {
    const off = getOffset(item.axisStep!);
    if (isNaN(off)) return acc;
    const varKey = item.variableName.toLowerCase(); // normalize to lowercase to match dataset keys
    acc[off] = acc[off] || {};
    acc[off][varKey] = item.value ?? 0;
    return acc;
  }, {} as Record<number, Record<string, number>>);

  // Build sorted offsets and dynamic month labels
  const offsets = Object.keys(groupedData)
    .map(k => parseInt(k, 10))
    .filter(o => !isNaN(o))
    .sort((a, b) => a - b);

  const monthLabels = offsets.map(off =>
    new Date(new Date().getFullYear(), new Date().getMonth() + off, 1)
      .toLocaleString('default', { month: 'short' })
  );

  // Determine variables present in the dataset dynamically (e.g., payable, receivable, overdue)
  const variables = Array.from(
    new Set(
      Object.values(groupedData).flatMap(obj => Object.keys(obj))
    )
  );

  // Provide a default color palette and fall back to gray if not defined
  const colors: Record<string, string> = {
    payable: 'rgba(54, 162, 235, 0.6)',   // blue
    receivable: 'rgba(75, 192, 192, 0.6)', // teal
    overdue: 'rgba(255, 99, 132, 0.6)',    // red
  };

  // Fallback palette for any additional variables
  const fallbackPalette = [
    'rgba(153, 102, 255, 0.6)',  // purple
    'rgba(255, 159, 64, 0.6)',   // orange
    'rgba(201, 203, 207, 0.6)',  // gray
  ];

  const datasets = variables.map((variable, idx) => {
    const color = colors[variable] || fallbackPalette[idx % fallbackPalette.length];
    return {
      label: variable.charAt(0).toUpperCase() + variable.slice(1),
      data: offsets.map(off => groupedData[off]?.[variable] ?? 0),
      backgroundColor: color,
      borderColor: color.replace('0.6', '1'),
      borderWidth: 1,
    };
  });

  const chartData = { labels: monthLabels, datasets };

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
