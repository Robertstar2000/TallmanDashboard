'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardData, MetricItem, HistoricalDataPoint, AccountsDataPoint, DailyOrderData, WebOrderData, SiteDistribution, SpreadsheetDataWithPopupSupport, POROverviewData, ARAgingDataPoint, CustomerMetricPoint, InventoryDataPoint, POROverviewPoint, SiteDistributionPoint, ARAgingPoint, DailyOrderPoint, WebOrderPoint } from '@/lib/db/types';
// import { dashboardStateMachine } from '@/lib/state/stateMachine'; // Commented out - file doesn't exist
import { MetricsSection } from './MetricsSection';
import { ChartsSection } from './ChartsSection';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

type DashboardStateData = DashboardData & SpreadsheetDataWithPopupSupport;

interface ChartData {
  historicalData: HistoricalDataPoint[];
  accounts: AccountsDataPoint[];
  customerMetrics: CustomerMetricPoint[];
  inventory: InventoryDataPoint[];
  porOverview: POROverviewPoint[];
  siteDistribution: SiteDistributionPoint[];
  arAging: ARAgingPoint[];
  dailyOrders: DailyOrderPoint[];
  webOrders: WebOrderPoint[];
}

interface DashboardProps {
  data: DashboardData | null;
  loading?: boolean;
}

export function Dashboard({ data, loading = false }: DashboardProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (data) {
      console.log('Dashboard received data:', {
        metrics: data.metrics?.length || 0,
        historicalData: data.historicalData?.length || 0,
        accounts: data.accounts?.length || 0,
        customerMetrics: data.customerMetrics?.length || 0,
        inventory: data.inventory?.length || 0,
        porOverview: data.porOverview?.length || 0,
        siteDistribution: data.siteDistribution?.length || 0,
        arAging: data.arAging?.length || 0,
        dailyOrders: data.dailyOrders?.length || 0,
        webOrders: data.webOrders?.length || 0
      });
    }
  }, [data]);

  // Display error state
  if (error) {
    return (
      <div className="w-full p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (loading || !data) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Ensure all data arrays are properly initialized
  const processedData: ChartData = {
    historicalData: data.historicalData?.map(item => ({
      id: item.id || `hist-${Math.random().toString(36).substr(2, 9)}`,
      date: item.date || '',
      sales: typeof item.sales === 'number' ? item.sales : 0,
      orders: typeof item.orders === 'number' ? item.orders : 0,
      combined: typeof item.combined === 'number' ? item.combined : 0
    })) || [],
    accounts: (() => {
      const raw = data.accounts || [];
      const steps = Array.from(new Set(raw.map(r => r.axisStep))).filter(Boolean) as string[];
      const now = new Date();
      return steps.map(step => {
        let offset = 0;
        if (String(step).toLowerCase() !== 'current') {
          const m = /-?\d+/.exec(String(step));
          offset = m ? parseInt(m[0], 10) : 0;
        }
        const date = new Date(now.getFullYear(), now.getMonth() + offset, 1)
          .toISOString().split('T')[0];
        const receivablesItem = raw.find(r => r.axisStep === step && r.variableName.toLowerCase() === 'receivables');
        const payablesItem = raw.find(r => r.axisStep === step && r.variableName.toLowerCase() === 'payables');
        return {
          date,
          receivables: receivablesItem?.value ?? 0,
          payables: payablesItem?.value ?? 0
        };
      }).sort((a, b) => a.date.localeCompare(b.date));
    })(),
    customerMetrics: data.customerMetrics?.map(item => ({
      id: item.id || `cust-${Math.random().toString(36).substr(2, 9)}`,
      date: item.date || '',
      newCustomers: typeof item.newCustomers === 'number' ? item.newCustomers : 0,
      returning: 0 // Ensure returning is always a number
    })) || [],
    inventory: data.inventory?.map(item => ({
      id: item.id || `inv-${Math.random().toString(36).substr(2, 9)}`,
      department: item.department || '',
      inStock: typeof item.inStock === 'number' ? item.inStock : 0,
      onOrder: typeof item.onOrder === 'number' ? item.onOrder : 0
    })) || [],
    porOverview: data.porOverview?.map(item => ({
      id: item.id || `por-${Math.random().toString(36).substr(2, 9)}`,
      date: item.date || '',
      newRentals: typeof item.newRentals === 'number' ? item.newRentals : 0,
      openRentals: typeof item.openRentals === 'number' ? item.openRentals : 0,
      rentalValue: typeof item.rentalValue === 'number' ? item.rentalValue : 0
    })) || [],
    siteDistribution: data.siteDistribution?.map(item => ({
      id: item.id || `site-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || '',
      value: typeof item.value === 'number' ? item.value : 0
    })) || [],
    arAging: data.arAging?.map(item => {
      // Ensure we have valid data for AR Aging
      let amount = 0;
      if (item.amount !== undefined && item.amount !== null) {
        amount = typeof item.amount === 'number' 
          ? item.amount 
          : parseFloat(String(item.amount).replace(/[^0-9.-]+/g, ''));
        
        if (isNaN(amount)) {
          console.warn(`Invalid amount value in AR Aging: ${item.amount}, defaulting to 0`);
          amount = 0;
        }
      }
      
      return {
        id: item.id || `ar-${Math.random().toString(36).substr(2, 9)}`,
        range: item.range || 'Unknown',
        amount: amount
      };
    }) || [],
    dailyOrders: data.dailyOrders?.map(item => ({
      id: item.id || `daily-${Math.random().toString(36).substr(2, 9)}`,
      date: item.date || '',
      orders: typeof item.orders === 'number' ? item.orders : 0
    })) || [],
    webOrders: data.webOrders?.map(item => ({
      id: item.id || `web-${Math.random().toString(36).substr(2, 9)}`,
      date: item.date || '',
      orders: typeof item.orders === 'number' ? item.orders : 0,
      revenue: typeof item.revenue === 'number' ? item.revenue : 0
    })) || []
  };

  // Log processed data for debugging
  console.log('Processed chart data:', {
    historicalData: processedData.historicalData.length,
    accounts: processedData.accounts.length,
    customerMetrics: processedData.customerMetrics.length,
    inventory: processedData.inventory.length,
    porOverview: processedData.porOverview.length,
    siteDistribution: processedData.siteDistribution.length,
    arAging: processedData.arAging.length,
    dailyOrders: processedData.dailyOrders.length,
    webOrders: processedData.webOrders.length
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Metrics section */}
        <MetricsSection metrics={data.metrics || []} />
        
        {/* Charts section */}
        <ChartsSection data={processedData} />
      </div>
    </div>
  );
}
