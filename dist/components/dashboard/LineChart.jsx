import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
export function LineChart({ data, xField, yField, categories }) {
    const chartData = useMemo(() => {
        if (!categories) {
            // Single line chart
            const labels = data.map(item => item[xField]);
            const values = data.map(item => {
                const val = item[yField];
                return typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
            });
            return {
                labels,
                datasets: [
                    {
                        label: 'Value',
                        data: values,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                    },
                ],
            };
        }
        // Multi-line chart
        const uniqueLabels = Array.from(new Set(data.map(item => item[xField])));
        const colors = ['rgb(75, 192, 192)', 'rgb(255, 99, 132)', 'rgb(255, 205, 86)'];
        return {
            labels: uniqueLabels,
            datasets: categories.map((category, index) => ({
                label: category,
                data: uniqueLabels.map(label => {
                    const item = data.find(d => d[xField] === label && d.variableName === category);
                    const val = item ? item[yField] : 0;
                    return typeof val === 'string' ? parseFloat(val) || 0 : val || 0;
                }),
                borderColor: colors[index % colors.length],
                tension: 0.1,
            })),
        };
    }, [data, xField, yField, categories]);
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };
    return (<div style={{ height: '300px' }}>
      <Line data={chartData} options={options}/>
    </div>);
}
