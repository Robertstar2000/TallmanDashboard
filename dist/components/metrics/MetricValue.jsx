'use client';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
export function MetricValue({ name, value }) {
    const isCurrency = name.includes('revenue') ||
        name.includes('invoices') ||
        name.includes('sales');
    return (<span className="text-2xl font-bold">
      {isCurrency ? formatCurrency(value) : formatNumber(value)}
    </span>);
}
