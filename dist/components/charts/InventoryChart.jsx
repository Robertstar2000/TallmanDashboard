import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export default function InventoryChart({ data }) {
    // Handle case where data is undefined or empty
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64">No inventory data available</div>;
    }
    // Define the expected department order
    const departmentOrder = ['dept. 100', 'dept. 101', 'dept. 102', 'dept. 103', 'dept. 107'];
    // Filter and sort data by department order
    const sortedData = departmentOrder.map(dept => {
        const deptData = data.find(item => item.department === dept);
        return deptData || {
            id: `${dept}-missing`,
            department: dept,
            inStock: 0,
            onOrder: 0
        };
    });
    // Extract labels and data series
    const labels = sortedData.map(item => item.department || '');
    const inStockData = sortedData.map(item => item.inStock);
    const onOrderData = sortedData.map(item => item.onOrder);
    const chartData = {
        labels: labels,
        datasets: [
            {
                label: 'In Stock',
                data: inStockData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
            {
                label: 'On Order',
                data: onOrderData,
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
                text: 'Inventory',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString();
                    }
                }
            }
        }
    };
    return (<div className="h-64">
      <Bar data={chartData} options={options}/>
    </div>);
}
