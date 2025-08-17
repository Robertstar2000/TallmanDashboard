import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

    const formatNumber = (v: number) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
        return v.toLocaleString();
    };

    const prettifyLabel = (s: string) => s
        .replace(/_/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());

    const normalizeKey = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

    const preferredOrder: Partial<Record<ChartGroup, string[]>> = {
        [ChartGroup.ACCOUNTS]: ['payable', 'overdue', 'receivable'],
        [ChartGroup.INVENTORY]: ['instock', 'onorder'],
        [ChartGroup.POR_OVERVIEW]: ['newrentals', 'openrentals', 'rentalvalue'],
        [ChartGroup.HISTORICAL_DATA]: ['p21sales', 'porsales', 'totalsales'],
        [ChartGroup.CUSTOMER_METRICS]: ['newcustomers', 'prospects'],
        [ChartGroup.WEB_ORDERS]: ['orders', 'revenue'],
    };

    const splitDataPoint = (label: string) => {
        const cleaned = clean(label);
        // Support ", ", ",", " - ", "|" as separators
        const parts = cleaned.split(/[,|\-]\s*/);
        const category = parts[0] || cleaned;
        const groupName = parts[1] || category;
        return { category: clean(category), groupName: clean(groupName) };
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
        ChartGroup.WEB_ORDERS,
    ];

    if (title === ChartGroup.SITE_DISTRIBUTION) {
        // Donut chart for site distribution
        const aggregated: Record<string, number> = {};
        data.forEach(dp => {
            const name = dp.dataPoint;
            const val = Number(dp.value) || 0;
            aggregated[name] = (aggregated[name] || 0) + val;
        });
        const pieData = Object.entries(aggregated).map(([name, value]) => ({ name, value }));

        return (
            <div className="bg-primary p-4 rounded-lg shadow-lg h-96 flex flex-col">
                <h3 className="text-lg font-semibold text-text-primary mb-4">{getChartGroupDisplayName(title)}</h3>
                <div className="flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(Number(value))} />
                            <Legend wrapperStyle={{ color: legendColor }} formatter={(v: string) => prettifyLabel(v)} />
                            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );

    } else if (chartsToGroup.includes(title)) {
        const groupedData = data.reduce((acc, dp) => {
            const { category, groupName } = splitDataPoint(dp.dataPoint);
            const catKey = normalizeKey(category);
            const grpKey = clean(groupName);

            if (!barCategories.includes(catKey)) {
                barCategories.push(catKey);
            }

            if (!acc[grpKey]) {
                acc[grpKey] = { name: grpKey };
            }
            acc[grpKey][catKey] = (acc[grpKey][catKey] || 0) + (Number(dp.value) || 0);

            return acc;
        }, {} as Record<string, any>);

        chartData = Object.values(groupedData);
        
        const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (chartData.length > 0) {
            const getMonthKey = (name: string) => (name || '').trim().slice(0, 3);
            const aKey = getMonthKey((chartData[0] as any)?.name);
            if (monthOrder.includes(aKey)) {
                chartData.sort((a: any, b: any) => monthOrder.indexOf(getMonthKey(a.name)) - monthOrder.indexOf(getMonthKey(b.name)));
            }
        }

        // Enforce preferred legend ordering if provided for this chart group
        const order = preferredOrder[title];
        const orderedCats = order
            ? [...barCategories].sort((a, b) => (order.indexOf(a) - order.indexOf(b)))
            : barCategories;

        bars = orderedCats.map((category, index) => (
            <Bar key={category} dataKey={category} fill={colors[index % colors.length]} name={prettifyLabel(category)} />
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
                        <YAxis tick={{ fill: tickFill }} tickFormatter={formatNumber} />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            formatter={(value: number) => formatNumber(Number(value))}
                         />
                        <Legend wrapperStyle={{ color: legendColor }} formatter={(v: string) => prettifyLabel(v)} />
                        {bars}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
;

export default ChartCard;
