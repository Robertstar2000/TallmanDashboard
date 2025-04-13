import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
export default function WebOrdersChart({ data }) {
    // Handle case where data is undefined or empty
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64">No web orders data available</div>;
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
    const ordersData = reversedData.map(item => item.orders);
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'Orders',
                data: ordersData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
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
                text: 'Web Orders',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    stepSize: 1,
                }
            }
        }
    };
    return (<div className="h-64">
      <Line data={chartData} options={options}/>
    </div>);
}
