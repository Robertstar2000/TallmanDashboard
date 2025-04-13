'use client';
import * as React from 'react';
import { Package, PackageOpen, ShoppingCart, DollarSign, FileText, Truck, BarChart2 } from "lucide-react";
function MetricCard({ title, value, icon, color }) {
    return (<div className={`rounded-lg p-4 ${color} text-white flex flex-col`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>);
}
export function MetricsSection({ metrics }) {
    // Find metric by name, defaulting to 0 if not found
    const getMetricValue = (name) => {
        const metric = metrics.find(m => m.name === name);
        return (metric === null || metric === void 0 ? void 0 : metric.value) || 0;
    };
    // Format number as currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };
    return (<div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-4">
      <MetricCard title="Total Orders" value={getMetricValue('total_orders').toString()} icon={<Package className="h-5 w-5"/>} color="bg-blue-500"/>
      <MetricCard title="Open Orders" value={getMetricValue('open_orders').toString()} icon={<PackageOpen className="h-5 w-5"/>} color="bg-green-500"/>
      <MetricCard title="Open Orders 2" value={getMetricValue('open_orders_2').toString()} icon={<ShoppingCart className="h-5 w-5"/>} color="bg-purple-500"/>
      <MetricCard title="Daily Revenue" value={formatCurrency(getMetricValue('daily_revenue'))} icon={<DollarSign className="h-5 w-5"/>} color="bg-yellow-500"/>
      <MetricCard title="Open Invoices" value={formatCurrency(getMetricValue('open_invoices'))} icon={<FileText className="h-5 w-5"/>} color="bg-pink-500"/>
      <MetricCard title="Orders Backlogged" value={getMetricValue('orders_backlogged').toString()} icon={<Truck className="h-5 w-5"/>} color="bg-red-500"/>
      <MetricCard title="Total Sales Monthly" value={formatCurrency(getMetricValue('total_sales_monthly'))} icon={<BarChart2 className="h-5 w-5"/>} color="bg-orange-500"/>
    </div>);
}
