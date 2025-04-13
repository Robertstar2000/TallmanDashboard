'use client';

import { MetricsSection } from './dashboard/MetricsSection';
import { ChartsSection } from './dashboard/ChartsSection';
import { MetricItem } from '@/lib/db/types';

interface DashboardGridProps {
  data: {
    metrics: MetricItem[];
    historicalData: {
      id: string;
      date: string;
      value1: number;
      value2: number;
      value3: number;
    }[];
    accounts: {
      id: string;
      date: string;
      payable: number;
      receivable: number;
      overdue: number;
    }[];
    customerMetrics: {
      id: string;
      date: string;
      newCustomers: number;
      returning: number;
    }[];
    inventory: {
      id: string;
      department: string;
      inStock: number;
      onOrder: number;
    }[];
    porOverview: {
      id: string;
      date: string;
      newRentals: number;
      openRentals: number;
      rentalValue: number;
    }[];
    siteDistribution: {
      id: string;
      name: string;
      value: number;
    }[];
    arAging: {
      id: string;
      range: string;
      amount: number;
    }[];
    dailyOrders: {
      id: string;
      date: string;
      orders: number;
    }[];
    webOrders: {
      id: string;
      date: string;
      orders: number;
      revenue: number;
    }[];
  };
}

export function DashboardGrid({ data }: DashboardGridProps) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid gap-4">
        <MetricsSection metrics={data.metrics} />
        <ChartsSection data={data} />
      </div>
    </div>
  );
}
