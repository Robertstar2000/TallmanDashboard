import { TrendingUp, Package, Truck, DollarSign, CreditCard, TrendingDown, BarChart3 } from 'lucide-react';
const icons = {
    total_orders: TrendingUp,
    open_orders: Package,
    in_process: Truck,
    weekly_revenue: DollarSign,
    open_invoices: CreditCard,
    orders_backlogged: TrendingDown,
    total_sales_monthly: BarChart3
};
const gradients = {
    total_orders: 'bg-blue-100',
    open_orders: 'bg-green-100',
    in_process: 'bg-purple-100',
    weekly_revenue: 'bg-yellow-100',
    open_invoices: 'bg-pink-100',
    orders_backlogged: 'bg-red-100',
    total_sales_monthly: 'bg-indigo-100'
};
export const getMetricIcon = (name) => {
    return icons[name] || TrendingUp;
};
export const getMetricGradient = (name) => {
    return gradients[name] || 'bg-gray-100';
};
