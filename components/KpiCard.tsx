
import React from 'react';
import { DashboardDataPoint } from '../types';

interface KpiCardProps {
    metric: DashboardDataPoint;
}

const KpiCard: React.FC<KpiCardProps> = ({ metric }) => {
    const isCurrency = metric.dataPoint.includes('$');
    const formattedValue = isCurrency
        ? `$${Number(metric.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : Number(metric.value).toLocaleString('en-US');

    return (
        <div className="bg-primary p-5 rounded-lg shadow-lg transform hover:-translate-y-1 transition-transform duration-300 ease-in-out border-l-4 border-accent">
            <h3 className="text-sm font-medium text-text-secondary truncate">{metric.dataPoint}</h3>
            <p className="mt-1 text-3xl font-semibold text-text-primary">{formattedValue}</p>
            <p className="text-xs text-text-secondary mt-2">
                Last updated: {new Date(metric.lastUpdated).toLocaleTimeString()}
            </p>
        </div>
    );
};

export default KpiCard;