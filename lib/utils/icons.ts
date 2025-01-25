import { TrendingUp, Package, Truck, DollarSign, CreditCard, TrendingDown, BarChart3 } from 'lucide-react';

export type MetricName = 'total_orders' | 'open_orders' | 'in_process' | 'weekly_revenue' | 'open_invoices' | 'orders_backlogged' | 'total_sales_monthly';

const icons = {
  total_orders: TrendingUp,
  open_orders: Package,
  in_process: Truck,
  weekly_revenue: DollarSign,
  open_invoices: CreditCard,
  orders_backlogged: TrendingDown,
  total_sales_monthly: BarChart3
} as const;

const gradients = {
  total_orders: 'bg-blue-100',
  open_orders: 'bg-green-100',
  in_process: 'bg-purple-100',
  weekly_revenue: 'bg-yellow-100',
  open_invoices: 'bg-pink-100',
  orders_backlogged: 'bg-red-100',
  total_sales_monthly: 'bg-indigo-100'
} as const;

export const getMetricIcon = (name: MetricName) => {
  return icons[name] || TrendingUp;
};

export const getMetricGradient = (name: MetricName) => {
  return gradients[name] || 'bg-gray-100';
};