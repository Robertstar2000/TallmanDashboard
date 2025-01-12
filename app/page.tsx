'use client';

import React, { useState } from 'react';
import { RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricsSection } from '@/components/dashboard/MetricsSection';
import { ChartsSection } from '@/components/dashboard/ChartsSection';
import { TopProductsCard } from '@/components/charts/TopProductsCard';
import { ChartDialog, ChartData, ColumnDef } from '@/components/dashboard/ChartDialog';
import { useDashboardData } from '@/lib/hooks/useDashboardData';
import { 
  HistoricalDataPoint, 
  DailyShipment, 
  AccountsPayableData,
  CustomerData,
  DashboardData
} from '@/lib/types/dashboard';
import { useRouter } from 'next/navigation';

type PopupType = 'historical' | 'payables' | 'shipments' | 'customers' | 'distribution' | 'products' | 'metrics' | null;

export default function Dashboard() {
  const { data, isLoading, refreshData, updateData } = useDashboardData();
  const [activePopup, setActivePopup] = useState<PopupType>(null);
  const router = useRouter();

  if (isLoading) {
    return <div className="p-4">Loading dashboard data...</div>;
  }

  const handleDataUpdate = <T,>(key: keyof DashboardData, updatedData: T) => {
    if (!data) return;
    updateData(key, updatedData);
  };

  const handleMaximize = (type: PopupType) => (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setActivePopup(type);
  };

  const getDialogConfig = () => {
    if (!data || !activePopup) return null;
    
    switch (activePopup) {
      case 'historical':
        return {
          title: 'Historical Data',
          data: data.historicalData.map(d => ({
            date: d.date,
            p21: d.p21,
            por: d.por
          })) as ChartData[],
          columns: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'p21', label: 'P21', format: 'number' },
            { key: 'por', label: 'POR', format: 'number' }
          ] as ColumnDef[]
        };
      case 'payables':
        return {
          title: 'Accounts Payable',
          data: data.accountsPayable.map(d => ({
            date: d.date,
            total: d.total,
            overdue: d.overdue
          })) as ChartData[],
          columns: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'total', label: 'Total', format: 'currency' },
            { key: 'overdue', label: 'Overdue', format: 'currency' }
          ] as ColumnDef[]
        };
      case 'customers':
        return {
          title: 'Customer Data',
          data: data.customers.map(d => ({
            date: d.date,
            new: d.new,
            prospects: d.prospects
          })) as ChartData[],
          columns: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'new', label: 'New Customers', format: 'number' },
            { key: 'prospects', label: 'Prospects', format: 'number' }
          ] as ColumnDef[]
        };
      case 'distribution':
        return {
          title: 'Site Distribution',
          data: data.siteDistribution.map(d => ({
            date: d.date,
            columbus: d.columbus,
            addison: d.addison,
            lakeCity: d.lakeCity
          })) as ChartData[],
          columns: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'columbus', label: 'Columbus', format: 'number' },
            { key: 'addison', label: 'Addison', format: 'number' },
            { key: 'lakeCity', label: 'Lake City', format: 'number' }
          ] as ColumnDef[]
        };
      case 'shipments':
        return {
          title: 'Daily Shipments',
          data: data.dailyShipments.map(d => ({
            date: d.date,
            shipments: d.shipments
          })) as ChartData[],
          columns: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'shipments', label: 'Shipments', format: 'number' }
          ] as ColumnDef[]
        };
      case 'metrics':
        return {
          title: 'Metrics',
          data: data.metrics.map(m => ({
            date: new Date().toISOString().split('T')[0],
            name: m.name,
            value: m.value,
            change: m.change
          })) as ChartData[],
          columns: [
            { key: 'date', label: 'Date', format: 'date' },
            { key: 'name', label: 'Metric' },
            { key: 'value', label: 'Value', format: 'number' },
            { key: 'change', label: 'Change %', format: 'number' }
          ] as ColumnDef[]
        };
      case 'products':
        const productsArray = Object.entries(data.products).flatMap(([category, products]) =>
          products.map((p: { name: string; value: number }) => ({
            category,
            name: p.name,
            value: p.value
          }))
        );
        return {
          title: 'Top Products',
          data: productsArray as ChartData[],
          columns: [
            { key: 'category', label: 'Category' },
            { key: 'name', label: 'Product Name' },
            { key: 'value', label: 'Value', format: 'currency' }
          ] as ColumnDef[]
        };
      default:
        return null;
    }
  };

  const dialogConfig = getDialogConfig();

  if (!data) return null;

  return (
    <div className="p-2 h-screen bg-gray-50 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="outline">
            Admin
          </Button>
          <Button onClick={refreshData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* 4-Column Layout */}
      <div className="flex-1 grid grid-cols-[250px_1fr_1fr_300px] gap-4 overflow-hidden">
        {/* Column 1: Metrics */}
        <div className="bg-white rounded-lg shadow p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Metrics</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleMaximize('metrics')}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <MetricsSection metrics={data.metrics} />
        </div>

        {/* Column 2: Historical Data & Accounts Payable */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow p-4 h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Historical Data</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMaximize('historical')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[250px]">
              <ChartsSection 
                historicalData={data.historicalData}
                onHistoricalUpdate={(updatedData: HistoricalDataPoint[]) => handleDataUpdate('historicalData', updatedData)}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Accounts Payable</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMaximize('payables')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[250px]">
              <ChartsSection 
                accountsPayable={data.accountsPayable}
                onAccountsPayableUpdate={(updatedData: AccountsPayableData[]) => handleDataUpdate('accountsPayable', updatedData)}
              />
            </div>
          </div>
        </div>

        {/* Column 3: Daily Shipments & Customers */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow p-4 h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Daily Shipments</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMaximize('shipments')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[250px]">
              <ChartsSection 
                dailyShipments={data.dailyShipments}
                onShipmentsUpdate={(updatedData: DailyShipment[]) => handleDataUpdate('dailyShipments', updatedData)}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Customer Data</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMaximize('customers')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[250px]">
              <ChartsSection 
                customers={data.customers}
                onCustomersUpdate={(updatedData: CustomerData[]) => handleDataUpdate('customers', updatedData)}
              />
            </div>
          </div>
        </div>

        {/* Column 4: Site Distribution & Top Products */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="bg-white rounded-lg shadow p-4 h-[300px]">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Site Distribution</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMaximize('distribution')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[250px]">
              <ChartsSection 
                siteDistribution={data.siteDistribution}
                onSiteDistributionUpdate={(updatedData) => handleDataUpdate('siteDistribution', updatedData)}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 flex-1 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Top Products</h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMaximize('products')}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
            <TopProductsCard products={data.products} />
          </div>
        </div>
      </div>

      {/* Dialog */}
      {dialogConfig && (
        <ChartDialog
          isOpen={!!activePopup}
          onClose={() => setActivePopup(null)}
          title={dialogConfig.title}
          data={dialogConfig.data}
          columns={dialogConfig.columns}
        />
      )}
    </div>
  );
}