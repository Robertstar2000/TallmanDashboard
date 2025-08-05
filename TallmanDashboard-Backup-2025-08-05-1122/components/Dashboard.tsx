
import React from 'react';
import { DashboardDataPoint, ChartGroup } from '../types';
import { KEY_METRICS_VARS } from '../constants';
import { ChartIcon } from './ChartIcon';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';

interface DashboardProps {
    dataPoints: DashboardDataPoint[];
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

const Dashboard: React.FC<DashboardProps> = ({ dataPoints }) => {
    const keyMetrics = dataPoints.filter(dp => KEY_METRICS_VARS.includes(dp.variableName));
    const chartDataPoints = dataPoints.filter(dp => !KEY_METRICS_VARS.includes(dp.variableName));

    const groupedCharts = chartDataPoints.reduce((acc, dp) => {
        (acc[dp.chartGroup] = acc[dp.chartGroup] || []).push(dp);
        return acc;
    }, {} as Record<ChartGroup, DashboardDataPoint[]>);

    return (
        <div className="space-y-8">
            {/* Key Metrics Section */}
            <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    {keyMetrics.map(metric => (
                        <KpiCard key={metric.id} metric={metric} />
                    ))}
                </div>
            </div>

            {/* Charts Section */}
            <div>
                 <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <ChartIcon />
                    Data Groups
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(groupedCharts).map(([group, data]) => (
                        <ChartCard key={group} title={group as ChartGroup} data={data} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
