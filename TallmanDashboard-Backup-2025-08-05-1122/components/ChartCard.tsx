
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardDataPoint, ChartGroup } from '../types';
import { useGlobal } from '../contexts/GlobalContext';

interface ChartCardProps {
    title: ChartGroup;
    data: DashboardDataPoint[];
}

// Convert technical chart group names to user-friendly display names
const getChartGroupDisplayName = (chartGroup: ChartGroup): string => {
    const displayNames: Record<ChartGroup, string> = {
        [ChartGroup.KEY_METRICS]: "Key Metrics",
        [ChartGroup.ACCOUNTS]: "Accounts",
        [ChartGroup.CUSTOMER_METRICS]: "Customer Metrics",
        [ChartGroup.INVENTORY]: "Inventory",
        [ChartGroup.POR_OVERVIEW]: "POR Overview",
        [ChartGroup.DAILY_ORDERS]: "Daily Orders",
        [ChartGroup.AR_AGING]: "AR Aging",
        [ChartGroup.HISTORICAL_DATA]: "Historical Data",
        [ChartGroup.SITE_DISTRIBUTION]: "Site Distribution",
        [ChartGroup.WEB_ORDERS]: "Web Orders",
    };
    return displayNames[chartGroup] || chartGroup;
};

// Define color palettes for light and dark themes
const barColors = {
    light: ['#4c51bf', '#667eea', '#a3bffa'],
    dark: ['#8884d8', '#82ca9d', '#ffc658'],
};

const ChartCard: React.FC<ChartCardProps> = ({ title, data }) => {
    const { theme } = useGlobal();
    const colors = theme === 'dark' ? barColors.dark : barColors.light;
    const gridStroke = theme === 'dark' ? '#4a5568' : '#e2e8f0';
    const tickFill = theme === 'dark' ? '#a0aec0' : '#718096';
    const legendColor = theme === 'dark' ? '#e2e8f0' : '#1a202c';
    const tooltipStyle = {
        backgroundColor: theme === 'dark' ? '#2d3748' : '#ffffff',
        border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e2e8f0'}`,
        color: legendColor
    };

    let chartData: any[];
    let bars: React.ReactNode;
    const barCategories: string[] = [];

    const chartsToGroup = [
        ChartGroup.ACCOUNTS,
        ChartGroup.CUSTOMER_METRICS,
        ChartGroup.HISTORICAL_DATA,
        ChartGroup.INVENTORY,
        ChartGroup.POR_OVERVIEW,
    ];

    if (chartsToGroup.includes(title)) {
        const groupedData = data.reduce((acc, dp) => {
            const parts = dp.dataPoint.split(', ');
            const category = parts[0];
            const groupName = parts.length > 1 ? parts[1] : category;
            
            if (!barCategories.includes(category)) {
                barCategories.push(category);
            }

            if (!acc[groupName]) {
                acc[groupName] = { name: groupName };
            }
            acc[groupName][category] = Number(dp.value) || 0;

            return acc;
        }, {} as Record<string, any>);

        chartData = Object.values(groupedData);
        
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (monthOrder.includes(chartData[0]?.name)) {
            chartData.sort((a, b) => monthOrder.indexOf(a.name) - monthOrder.indexOf(b.name));
        }

        bars = barCategories.map((category, index) => (
            <Bar key={category} dataKey={category} fill={colors[index % colors.length]} name={category} />
        ));

    } else {
        chartData = data.map(dp => ({
            name: dp.dataPoint,
            value: Number(dp.value) || 0,
        }));

        if (title === ChartGroup.DAILY_ORDERS) {
            const getDaySuffix = (name: string) => {
                const parts = name.split(', ');
                return parts.length > 1 ? parts[1] : name;
            };
            const getSortValue = (suffix: string) => {
                if (!suffix) return 0;
                if (suffix === 'Today') return 6;
                const parts = suffix.split('-');
                if (parts.length > 1) {
                    return 6 - parseInt(parts[1], 10);
                }
                return 0;
            };
            chartData.sort((a, b) => getSortValue(getDaySuffix(a.name)) - getSortValue(getDaySuffix(b.name)));
        }
        
        bars = <Bar dataKey="value" fill={colors[0]} name="Value" />;
    }

    return (
        <div className="bg-primary p-4 rounded-lg shadow-lg h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{getChartGroupDisplayName(title)}</h3>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 20,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="name" tick={{ fill: tickFill }} fontSize={12} interval={0} angle={-30} textAnchor="end" height={70}/>
                        <YAxis tick={{ fill: tickFill }} />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(value: number) => value.toLocaleString()}
                         />
                        <Legend wrapperStyle={{ color: legendColor }}/>
                        {bars}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ChartCard;
