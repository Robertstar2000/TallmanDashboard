'use client';

import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface MetricValueProps {
  name: string;
  value: number;
}

export function MetricValue({ name, value }: MetricValueProps) {
  const isCurrency = name.includes('revenue') || 
                    name.includes('invoices') || 
                    name.includes('sales');
                    
  return (
    <span className="text-2xl font-bold">
      {isCurrency ? formatCurrency(value) : formatNumber(value)}
    </span>
  );
}