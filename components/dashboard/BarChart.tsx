import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { SpreadsheetRow } from '@/lib/types/dashboard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SimpleDataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: SpreadsheetRow[] | SimpleDataItem[];
  xField: string;
  yField: string;
  categories?: string[];
  format?: 'number' | 'currency';
}

export function BarChart({ data, xField, yField, categories, format = 'number' }: BarChartProps) {
  const chartData = useMemo(() => {
    const formatValue = (value: number) => {
      if (format === 'currency') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      }
      return new Intl.NumberFormat('en-US').format(value);
    };

    if (!categories) {
      // Single series bar chart
      const labels = data.map(item => item[xField as keyof typeof item] as string);
      const values = data.map(item => {
        const val = item[yField as keyof typeof item];
        return typeof val === 'string' ? parseFloat(val) : (val as number) || 0;
      });

      return {
        labels,
        datasets: [
          {
            label: 'Value',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
        ],
      };
    }

    // Multi-series bar chart
    const uniqueLabels = Array.from(new Set(data.map(item => item[xField as keyof typeof item] as string)));
    const colors = [
      'rgba(75, 192, 192, 0.5)',
      'rgba(255, 99, 132, 0.5)',
      'rgba(255, 205, 86, 0.5)',
    ];

    return {
      labels: uniqueLabels,
      datasets: categories.map((category, index) => ({
        label: category,
        data: uniqueLabels.map(label => {
          const item = (data as SpreadsheetRow[]).find(
            d => d[xField as keyof typeof d] === label && d.variableName === category
          );
          const value = item ? item[yField as keyof typeof item] : 0;
          return typeof value === 'string' ? parseFloat(value) || 0 : (value as number) || 0;
        }),
        backgroundColor: colors[index % colors.length],
      })),
    };
  }, [data, xField, yField, categories, format]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (format === 'currency') {
                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
              } else {
                label += new Intl.NumberFormat('en-US').format(context.parsed.y);
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            if (format === 'currency') {
              return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
            }
            return new Intl.NumberFormat('en-US').format(value);
          }
        }
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
