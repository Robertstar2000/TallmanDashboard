import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Metrics shown in the left column
const DASHBOARD_METRICS = [
    'Total Orders',
    'Open Orders',
    'Open Orders 2',
    'Daily Revenue',
    'Open Invoices',
    'Orders Backlogged',
    'Total Sales Monthly'
];
const getCardColor = (name) => {
    const colorMap = {
        'Total Orders': 'bg-blue-500',
        'Open Orders': 'bg-green-500',
        'Open Orders 2': 'bg-purple-500',
        'Daily Revenue': 'bg-amber-500',
        'Open Invoices': 'bg-pink-500',
        'Orders Backlogged': 'bg-red-500',
        'Total Sales Monthly': 'bg-orange-500'
    };
    return colorMap[name] || 'bg-gray-500';
};
const formatValue = (value, formatAsCurrency) => {
    // Convert string to number if needed
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    // Check if it's a valid number
    if (isNaN(numValue)) {
        return String(value);
    }
    if (formatAsCurrency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numValue);
    }
    return numValue.toLocaleString();
};
export function Metrics({ variables }) {
    console.log('Debug Info:');
    console.log('Variables count:', variables.length);
    console.log('All variable names:', variables.map(v => v.name).join(', '));
    const dashboardMetrics = variables
        .filter(v => DASHBOARD_METRICS.includes(v.name))
        .sort((a, b) => {
        const indexA = DASHBOARD_METRICS.indexOf(a.name);
        const indexB = DASHBOARD_METRICS.indexOf(b.name);
        return indexA - indexB;
    });
    console.log('Filtered metrics:', dashboardMetrics.map(m => ({
        name: m.name,
        value: m.value,
        chartGroup: m.chartGroup
    })));
    // Get all errors, including system errors
    const errors = variables
        .filter(v => v.error)
        .map(v => ({
        source: v.chartGroup === 'System' ? 'System' : v.name,
        message: v.error
    }))
        .sort((a, b) => {
        // Show system errors first, then sort by source name
        if (a.source === 'System')
            return -1;
        if (b.source === 'System')
            return 1;
        return a.source.localeCompare(b.source);
    });
    return (<div className="flex flex-col space-y-2 w-64">
      {dashboardMetrics.map((metric) => (<Card key={metric.id} className={`${getCardColor(metric.name)} text-white hover:opacity-90 transition-opacity`}>
          <CardContent className="p-3">
            <div className="text-sm font-medium opacity-90">{metric.name}</div>
            <div className="text-xl font-bold">
              {formatValue(metric.value, metric.formatAsCurrency)}
            </div>
          </CardContent>
        </Card>))}
      
      {/* Error Messages Section */}
      {errors.length > 0 && (<Card className="bg-red-50 border-red-200">
          <CardContent className="p-3">
            <div className="text-sm font-medium text-red-800 mb-1">Error Messages</div>
            <div className="text-xs text-red-600 space-y-1">
              {errors.map((error, index) => (<div key={index} className="flex items-start space-x-1">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    <span className="font-medium">{error.source}:</span> {error.message}
                  </span>
                </div>))}
            </div>
          </CardContent>
        </Card>)}
    </div>);
}
