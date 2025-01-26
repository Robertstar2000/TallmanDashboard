'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Package, Truck, DollarSign, CreditCard, TrendingDown } from 'lucide-react';
import { EditableMetricCard } from '@/components/EditableMetricCard';
import { DailyOrdersChart } from '@/components/charts/DailyOrdersChart';
import { AccountsPayableChart } from '@/components/charts/AccountsPayableChart';
import { PORChart } from '@/components/charts/PORChart';
import { Web_Metrics_Chart } from '@/components/charts/Web_Metrics_Chart';
import { SiteDistributionChart } from '@/components/charts/SiteDistributionChart';
import { InventoryChart } from '@/components/charts/InventoryChart';
import { HistoricalDataChart } from '@/components/charts/HistoricalDataChart';
import { CustomerChart } from '@/components/charts/CustomerChart';
import { ARAgingChart } from '@/components/charts/ARAgingChart';
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
import { AdminButton } from '@/components/AdminButton';

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
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([
    { date: '2024-01-01', orders: 150 },
    { date: '2024-01-02', orders: 230 },
    { date: '2024-01-03', orders: 224 },
    { date: '2024-01-04', orders: 218 },
    { date: '2024-01-05', orders: 335 },
    { date: '2024-01-06', orders: 247 },
    { date: '2024-01-07', orders: 284 },
  ]);
  const [siteDistribution, setSiteDistribution] = useState<SiteDistribution[]>([]);
  const [customerData, setCustomerData] = useState<CustomerMetric[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>([]);
  const [porData, setPorData] = useState<PORData[]>([]);
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
    resetData(); // Reset all data to initial state
    const metricsData = getMetrics();
    console.log('Loaded metrics data:', metricsData);
    setMetrics(Array.isArray(metricsData) ? metricsData : []);
    const dailyOrdersData = getDailyOrders();
    console.log('Loaded daily orders data:', dailyOrdersData);
    setDailyOrders(Array.isArray(dailyOrdersData) ? dailyOrdersData : []);
    const siteDistData = getSiteDistribution();
    console.log('Loaded site distribution data:', siteDistData);
    setSiteDistribution(Array.isArray(siteDistData) ? siteDistData : []);
    const custData = getCustomerMetrics();
    console.log('Loaded customer metrics data:', custData);
    setCustomerData(Array.isArray(custData) ? custData : []);
    const accounts = getAccounts();
    console.log('Loaded accounts data:', accounts);
    setAccountsPayable(Array.isArray(accounts) ? accounts : []);
    const porMetrics = getPOR();
    console.log('Loaded POR metrics data:', porMetrics);
    setPorData(Array.isArray(porMetrics) ? porMetrics : []);
    const inventory = getInventoryValue();
    console.log('Loaded inventory data:', inventory);
    setInventoryData(Array.isArray(inventory) ? inventory : []);
    const webData = getWebMetrics();
    console.log('Loaded web metrics data:', webData);
    setWebMetrics(Array.isArray(webData) ? webData : []);
    const historicalData = getHistoricalData();
    console.log('Loaded historical data:', historicalData);
    setHistoricalData(Array.isArray(historicalData) ? historicalData : []);
  }, []);

  const handleMetricUpdate = (name: string, value: number) => {
    const updatedMetrics = updateMetric(name, value);
    setMetrics(updatedMetrics);
  };

  return (
    <div className="h-[414px] bg-gray-50 flex flex-col max-w-[98vw] mx-auto overflow-hidden">
      <AdminButton />
      <div className="flex justify-between items-center h-[28px] shrink-0 px-2">
        <h1 className="text-[clamp(12px,1.2vw,14px)] text-red-600 font-bold text-center flex-grow truncate">
          Tallman Leadership Dashboard
        </h1>
      </div>
      
      <div className="flex gap-0.5 p-0.5 h-[336px]">
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
              <CustomerChart data={customerData} />
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