import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export default function AccountsChart({ data }) {
    // Handle case where data is undefined or empty
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64">No accounts data available</div>;
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
    const payableData = reversedData.map(item => item.payable);
    const receivableData = reversedData.map(item => item.receivable);
    const overdueData = reversedData.map(item => item.overdue);
    const chartData = {
        labels: labels,
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
                position: 'top',
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
                    callback: function (value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    };
    return (<div className="h-64">
      <Bar data={chartData} options={options}/>
    </div>);
}
