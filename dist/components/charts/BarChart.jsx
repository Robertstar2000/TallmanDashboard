'use client';
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
export function BarChart({ data, xKey, yKey, color, yAxisLabel = 'Value', xAxisLabel = 'Date', interval = 'month', onDataUpdate }) {
    const formatLabel = (value) => {
        if (!value.includes('-'))
            return value;
        const date = new Date(value);
        switch (interval) {
            case 'year':
                return date.getFullYear().toString();
            case 'month':
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            case 'week':
            case 'day':
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            default:
                return value;
        }
    };
    const chartData = {
        labels: data.map(item => formatLabel(String(item[xKey]))),
        datasets: [
            {
                label: String(yKey),
                data: data.map(item => Number(item[yKey])),
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1,
            },
        ],
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: yAxisLabel,
                    font: {
                        size: 11,
                        weight: 'bold'
                    }
                },
                ticks: {
                    font: {
                        size: 10
                    },
                    callback: function (tickValue, index, ticks) {
                        const value = Number(tickValue);
                        if (yAxisLabel.includes('$') && value >= 1000) {
                            return '$' + (value / 1000).toFixed(1) + 'k';
                        }
                        return value;
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: xAxisLabel,
                    font: {
                        size: 11,
                        weight: 'bold'
                    }
                },
                ticks: {
                    font: {
                        size: 10
                    },
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: false
                }
            }
        }
    };
    return (<div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Bar data={chartData} options={options}/>
    </div>);
}
