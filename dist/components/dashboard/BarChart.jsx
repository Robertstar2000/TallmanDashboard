import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export function BarChart({ data, xField, yField, categories, format = 'number' }) {
    const chartData = useMemo(() => {
        const formatValue = (value) => {
            if (format === 'currency') {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
            }
            return new Intl.NumberFormat('en-US').format(value);
        };
        if (!categories) {
            // Single series bar chart
            const labels = data.map(item => item[xField]);
            const values = data.map(item => {
                const val = item[yField];
                return typeof val === 'string' ? parseFloat(val) : val || 0;
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
        const uniqueLabels = Array.from(new Set(data.map(item => item[xField])));
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
                    const item = data.find(d => d[xField] === label && d.variableName === category);
                    const value = item ? item[yField] : 0;
                    return typeof value === 'string' ? parseFloat(value) || 0 : value || 0;
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
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            if (format === 'currency') {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            else {
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
                    callback: function (value) {
                        if (format === 'currency') {
                            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
                        }
                        return new Intl.NumberFormat('en-US').format(value);
                    }
                }
            },
        },
    };
    return (<div style={{ height: '300px' }}>
      <Bar data={chartData} options={options}/>
    </div>);
}
