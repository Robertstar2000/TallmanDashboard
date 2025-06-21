'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardData, HistoricalDataPoint, AccountsDataPoint, CustomerMetricPoint, InventoryDataPoint, SiteDistributionPoint, ARAgingPoint, DailyOrderPoint, WebOrderPoint, PORDailySalesPoint } from '@/lib/db/types';
import { MetricsSection } from './MetricsSection';
import { ChartsSection } from './ChartsSection';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Chart data after processing
interface ChartData {
  historicalData: HistoricalDataPoint[];
  accounts: AccountsDataPoint[];
  customerMetrics: CustomerMetricPoint[];
  inventory: InventoryDataPoint[];
  porOverview: PORDailySalesPoint[];
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
    customerMetrics: (() => {
      const raw = data.customerMetrics || [];
      const steps = Array.from(new Set(raw.map(r => r.axisStep))).filter(Boolean) as string[];
      const now = new Date();
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return steps.map(step => {
        // Compute date for month step
        const idx = monthNames.findIndex(m => m.toLowerCase() === step.substring(0,3).toLowerCase());
        const date = idx >= 0
          ? new Date(now.getFullYear(), idx, 1).toISOString().split('T')[0]
          : step;
        const newItem = raw.find(r => r.axisStep === step && /new/i.test(r.variableName));
        const returningItem = raw.find(r => r.axisStep === step && /(prospect|returning)/i.test(r.variableName));
        return {
          date,
          newCustomers: newItem?.value ?? 0,
          returningCustomers: returningItem?.value ?? 0,
        };
      }).sort((a, b) => a.date.localeCompare(b.date));
    })(),
    inventory: data.inventory?.map(item => ({
      id: item.id || `inv-${Math.random().toString(36).substr(2, 9)}`,
      department: item.department || '',
      inStock: typeof item.inStock === 'number' ? item.inStock : 0,
      onOrder: typeof item.onOrder === 'number' ? item.onOrder : 0
    })) || [],
    porOverview: data.porDailySales?.map(item => ({
      id: item.date,
      date: item.date,
      value: item.value
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
    dailyOrders: (data.dailyOrders || [])
      .map(item => ({ date: item.DataPoint || '', orders: item.value ?? 0 }))
      .filter(d => !!d.date)
      .sort((a, b) => a.date.localeCompare(b.date)),
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
