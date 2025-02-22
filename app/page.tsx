'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Truck, DollarSign, CreditCard, TrendingDown, Settings } from 'lucide-react';
import { EditableMetricCard } from '@/components/EditableMetricCard';
import { Button } from '@/components/ui/button';
import { DailyOrdersChart } from '@/components/charts/DailyOrdersChart';
import { AccountsPayableChart } from '@/components/charts/AccountsPayableChart';
import { PORChart } from '@/components/charts/PORChart';
import { Web_Metrics_Chart } from '@/components/charts/Web_Metrics_Chart';
import { SiteDistributionChart } from '@/components/charts/SiteDistributionChart';
import { InventoryChart } from '@/components/charts/InventoryChart';
import { HistoricalDataChart } from '@/components/charts/HistoricalDataChart';
import { CustomerChart } from '@/components/charts/CustomerChart';
import { ARAgingChart } from '@/components/charts/ARAgingChart';
import dynamic from 'next/dynamic';
import { 
  getMetrics, 
  updateMetric,
  getDailyOrders,
  getSiteDistribution,
  getCustomerMetrics,
  getAccounts,
  getPOR,
  getInventoryValue,
  getWebMetrics,
  resetData,
  getHistoricalData
} from '@/lib/db';
import Link from 'next/link';

interface Metric {
  [key: string]: string | number;
  name: string;
  value: number;
}

interface DailyOrder {
  [key: string]: string | number;
  date: string;
  orders: number;
}

interface SiteDistribution {
  [key: string]: string | number;
  name: string;
  value: number;
}

interface CustomerMetric {
  [key: string]: string | number;
  month: string;
  newCustomers: number;
  prospects: number;
}

interface AccountsPayable {
  [key: string]: string | number;
  month: string;
  payable: number;
  overdue: number;
  receivable: number;
}

interface PORData {
  [key: string]: string | number;
  month: string;
  newRentals: number;
  openRentals: number;
  rentalValue: number;
}

interface InventoryData {
  [key: string]: string | number;
  category: string;
  inStock: number;
  onOrder: number;
}

interface WebMetric {
  [key: string]: string | number;
  month: string;
  W_Orders: number;
  W_Revenue: number;
}

interface HistoricalData {
  [key: string]: string | number;
  month: string;
  p21: number;
  por: number;
  total: number;
}

interface ARAging {
  [key: string]: string | number;
  range: string;
  amount: number;
  color: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
  const [siteDistribution, setSiteDistribution] = useState<SiteDistribution[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>([]);
  const [porData, setPORData] = useState<PORData[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryData[]>([]);
  const [webMetrics, setWebMetrics] = useState<WebMetric[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [arAging, setARAging] = useState<ARAging[]>([
    { range: 'Current', amount: 125000, color: '#4CAF50' },
    { range: '1-30', amount: 75000, color: '#FFC107' },
    { range: '31-60', amount: 45000, color: '#FF9800' },
    { range: '61-90', amount: 25000, color: '#F44336' },
    { range: '90+', amount: 15000, color: '#D32F2F' }
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Reset data to ensure we have initial values
        resetData();
        
        // Load all data
        const metricsData = getMetrics();
        const dailyOrdersData = getDailyOrders();
        const siteDistData = getSiteDistribution();
        const custData = getCustomerMetrics();
        const accounts = getAccounts();
        const porMetrics = getPOR();
        const inventory = getInventoryValue();
        const webData = getWebMetrics();
        const histData = getHistoricalData();

        // Update state with loaded data
        setMetrics(metricsData);
        setDailyOrders(dailyOrdersData);
        setSiteDistribution(siteDistData);
        setCustomerMetrics(custData);
        setAccountsPayable(accounts);
        setPORData(porMetrics);
        setInventoryData(inventory);
        setWebMetrics(webData);
        setHistoricalData(histData);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    if (isClient) {
      loadData();
    }
  }, [isClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Loading Dashboard...</div>
          <div className="text-gray-600">Please wait while we fetch your data</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <div className="text-2xl font-semibold mb-2">Error Loading Dashboard</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const handleMetricUpdate = (name: string, value: number) => {
    const updatedMetrics = updateMetric(name, value);
    setMetrics(updatedMetrics);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/admin">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Admin
            </Button>
          </Link>
        </div>
        <h2 className="text-[clamp(12px,1.2vw,14px)] text-red-600 font-bold">
          Tallman Leadership Dashboard
        </h2>
      </div>

      <div className="flex gap-4 flex-1 w-full">
        {/* Left Column - Metrics */}
        <div className="w-1/6 grid grid-rows-6 gap-0.5 h-full">
          {metrics.map((metric: Metric) => (
            <div key={metric.name} className="max-h-[45px]">
              <EditableMetricCard
                icon={
                  metric.name === 'total_orders' ? <TrendingUp className="w-3 h-3" /> :
                  metric.name === 'open_orders' ? <Package className="w-3 h-3" /> :
                  metric.name === 'open_orders_2' ? <Truck className="w-3 h-3" /> :
                  metric.name === 'daily_revenue' ? <DollarSign className="w-3 h-3" /> :
                  metric.name === 'open_invoices' ? <CreditCard className="w-3 h-3" /> :
                  metric.name === 'orders_backlogged' ? <TrendingDown className="w-3 h-3" /> :
                  <TrendingUp className="w-3 h-3" />
                }
                title={metric.name.split('_').map((word: string) => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
                value={metric.name.includes('revenue') || metric.name.includes('invoices') || metric.name.includes('sales') 
                  ? `$${metric.value.toLocaleString()}`
                  : metric.value}
                gradient={
                  metric.name === 'total_orders' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  metric.name === 'open_orders' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  metric.name === 'open_orders_2' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                  metric.name === 'daily_revenue' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                  metric.name === 'open_invoices' ? 'bg-gradient-to-br from-pink-500 to-pink-600' :
                  metric.name === 'orders_backlogged' ? 'bg-gradient-to-br from-red-500 to-red-600' :
                  'bg-gradient-to-br from-orange-500 to-orange-600'
                }
                onUpdate={(value) => handleMetricUpdate(metric.name, value)}
              />
            </div>
          ))}
        </div>

        {/* Right Section - Charts in 3x3 Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2 h-full">
            {/* First Row */}
            <div className="h-[108px]">
              <AccountsPayableChart data={accountsPayable} />
            </div>
            <div className="h-[108px]">
              <CustomerChart data={customerMetrics} />
            </div>
            <div className="h-[108px]">
              <HistoricalDataChart data={historicalData} />
            </div>

            {/* Second Row */}
            <div className="h-[108px]">
              <InventoryChart data={inventoryData} />
            </div>
            <div className="h-[108px]">
              <PORChart data={porData} />
            </div>
            <div className="h-[108px]">
              <SiteDistributionChart data={siteDistribution} />
            </div>

            {/* Third Row */}
            <div className="h-[108px]">
              <DailyOrdersChart data={dailyOrders} />
            </div>
            <div className="h-[108px]">
              <Web_Metrics_Chart data={webMetrics} />
            </div>
            <div className="h-[108px]">
              <ARAgingChart data={arAging} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}