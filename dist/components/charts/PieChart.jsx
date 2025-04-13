'use client';
import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);
export function PieChart({ data, onDataUpdate }) {
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [
            {
                data: data.map(item => item.value),
                backgroundColor: [
                    '#4F46E5', // Indigo
                    '#10B981', // Emerald
                    '#F59E0B', // Amber
                    '#6366F1', // Blue
                    '#EC4899', // Pink
                    '#8B5CF6' // Purple
                ],
                borderWidth: 1,
                borderColor: '#ffffff'
            }
        ]
    };
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                align: 'center',
                labels: {
                    boxWidth: 15,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    // Ensure labels are displayed properly
                    generateLabels: (chart) => {
                        var _a, _b, _c, _d;
                        const originalLabels = ((_d = (_c = (_b = (_a = ChartJS.overrides.pie.plugins) === null || _a === void 0 ? void 0 : _a.legend) === null || _b === void 0 ? void 0 : _b.labels) === null || _c === void 0 ? void 0 : _c.generateLabels) === null || _d === void 0 ? void 0 : _d.call(_c, chart)) || [];
                        return originalLabels.map(label => {
                            // Don't truncate site names as they are short
                            return label;
                        });
                    }
                }
            },
            tooltip: {
                callbacks: {
                    // Show value in tooltip
                    label: (context) => {
                        const label = data[context.dataIndex].name || '';
                        const value = context.formattedValue;
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        layout: {
            padding: {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }
        }
    };
    return (<div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Pie data={chartData} options={options}/>
    </div>);
}
