'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardData, SpreadsheetData, AccountsPayableData, HistoricalDataPoint, DailyShipment, SiteDistribution, ProductsByCategory, CustomerData, SpreadsheetDataWithPopupSupport } from '@/lib/types/dashboard';
import { dashboardStateMachine } from '@/lib/state/stateMachine';
import { MetricsSection } from './MetricsSection';
import { ChartsSection } from './ChartsSection';
import { TopProductsCard } from '../charts/TopProductsCard';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { rawDashboardData } from '@/lib/db/raw-data';

type DashboardStateData = DashboardData & SpreadsheetDataWithPopupSupport;

export function Dashboard() {
  const [data, setData] = useState<DashboardStateData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = dashboardStateMachine.subscribe(state => {
      setData(state.data as DashboardStateData);
    });

    dashboardStateMachine.initialize();

    return () => {
      unsubscribe();
      return;
    };
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  const handleDataUpdate = (key: keyof DashboardStateData, updatedData: any) => {
    setData(prev => prev ? { ...prev, [key]: updatedData } : null);
  };

  return (
    <div className="p-2 h-screen bg-gray-50 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin')} variant="outline">
            Admin
          </Button>
          <Button onClick={() => dashboardStateMachine.refresh(rawDashboardData)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-[1fr_auto] gap-2">
        <div className="grid grid-rows-[auto_1fr] gap-2">
          <MetricsSection metrics={data.metrics} />
          <ChartsSection 
            historicalData={data.historicalData}
            dailyShipments={data.dailyShipments}
            accountsPayable={data.accountsPayable}
            customers={data.customers}
            onHistoricalUpdate={(updatedData: HistoricalDataPoint[]) => handleDataUpdate('historicalData', updatedData)}
            onShipmentsUpdate={(updatedData: DailyShipment[]) => handleDataUpdate('dailyShipments', updatedData)}
            onAccountsPayableUpdate={(updatedData: AccountsPayableData[]) => handleDataUpdate('accountsPayable', updatedData)}
            onCustomersUpdate={(updatedData: CustomerData[]) => handleDataUpdate('customers', updatedData)}
            onSiteDistributionUpdate={(updatedData: SiteDistribution[]) => handleDataUpdate('siteDistribution', updatedData)}
          />
        </div>
        <div className="w-[300px]">
          <TopProductsCard products={data.products} />
        </div>
      </div>
    </div>
  );
}
