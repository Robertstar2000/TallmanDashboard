import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export default function ARAgingChart({ data }) {
    // Handle case where data is undefined or empty
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64">No AR aging data available</div>;
    }
    // Define the expected time buckets
    const bucketOrder = ['Current (0-30 days)', '31-60 days', '61-90 days', 'Over 90 days'];
    // Filter and sort data by time buckets
    const sortedData = bucketOrder.map(bucket => {
        const bucketData = data.find(item => item.range === bucket);
        return bucketData || {
            id: `${bucket}-missing`,
            range: bucket,
            amount: 0
        };
    });
    // Extract labels and data series
    const labels = sortedData.map(item => item.range);
    const amounts = sortedData.map(item => item.amount);
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Amount Due',
                data: amounts,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.6)', // Current
                    'rgba(75, 192, 192, 0.6)', // 31-60 days
                    'rgba(255, 206, 86, 0.6)', // 61-90 days
                    'rgba(255, 99, 132, 0.6)', // Over 90 days
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'AR Aging',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const value = context.raw || 0;
                        return `$${value.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    };
    return (<div className="h-64 w-full">
      <Bar data={chartData} options={options}/>
    </div>);
}
