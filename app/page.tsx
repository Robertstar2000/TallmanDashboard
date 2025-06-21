'use client';

// Ensure this page is rendered dynamically on every request so middleware auth executes
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import AccountsChart from '@/components/charts/AccountsChart';
import { HistoricalDataChart } from '@/components/dashboard/HistoricalDataChart';
import CustomerMetricsChart from '@/components/charts/CustomerMetricsChart';
import { InventoryChart } from '@/components/dashboard/InventoryChart';
import POROverviewChart from '@/components/charts/POROverviewChart';
import { PORDailySalesPoint } from '@/lib/db/types';
import { SiteDistributionChart } from '@/components/dashboard/SiteDistributionChart';
import { ARAgingChart } from '@/components/dashboard/ARAgingChart';
import DailyOrdersChart from '@/components/charts/DailyOrdersChart';
import { DailyOrderPoint } from '@/lib/db/types';
import WebOrdersChart from '@/components/charts/WebOrdersChart';
import { WebOrderPoint } from '@/lib/db/types';
import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import { ChartDataRow } from '@/lib/db/types';
import { CustomerMetricPoint } from '@/lib/db/types';

// Placeholder type - will be replaced once API is implemented
type DashboardDataPlaceholder = {
  metrics: any[];
  accounts: any[]; // Assuming ChartDataRow structure for now
  historicalData: any[]; // Assuming ChartDataRow structure for now
  customerMetrics: any[]; // Assuming ChartDataRow structure for now
  inventory: any[]; // Assuming ChartDataRow structure for now
  porOverview: any[]; // Assuming ChartDataRow structure for now
  siteDistribution: any[]; // Assuming ChartDataRow structure for now
  arAging: any[]; // Assuming ChartDataRow structure for now
  dailyOrders: any[]; // Assuming ChartDataRow structure for now
  webOrders: any[]; // Assuming ChartDataRow structure for now
};

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardDataPlaceholder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Fetch data from the API
        const response = await fetch('/api/dashboard/data');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Home - Fetched dashboardData:', data);
        
        // Check if we received valid data
        if (!data || Object.keys(data).length === 0) {
          throw new Error('API returned empty data');
        }
        
        // Update the dashboard data state
        setDashboardData(data);
        setError(null);
      } catch (err) {
        // Log more detailed error information
        if (err instanceof Error) {
          console.error('Error fetching dashboard data:', err.message);
          console.error('Stack trace:', err.stack);
        } else {
          console.error('Error fetching dashboard data (unknown type):', err);
        }
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
    
    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(fetchDashboardData, 30000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Transform raw ChartDataRow for Customer Metrics into points usable by CustomerMetricsChart
  const processedCustomerMetrics = dashboardData?.customerMetrics?.length
    ? (() => {
        const raw = dashboardData.customerMetrics as any[];
        const steps = Array.from(new Set(raw.map(r => r.axisStep))).filter(Boolean) as string[];
        const now = new Date();
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return steps.map(step => {
          const idx = monthNames.findIndex(m => m.toLowerCase() === step.substring(0,3).toLowerCase());
          const date = idx >= 0
            ? new Date(now.getFullYear(), idx, 1).toISOString().split('T')[0]
            : step;
          const newItem = raw.find(r => r.axisStep === step && /new/i.test(r.variableName));
          const prospectItem = raw.find(r => r.axisStep === step && /prospect|returning/i.test(r.variableName));
          return { date, newCustomers: newItem?.value ?? 0, returningCustomers: prospectItem?.value ?? 0 };
        }).sort((a,b) => a.date.localeCompare(b.date));
      })()
    : [];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tallman Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs">
            Admin
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
        {dashboardData && dashboardData.metrics.map((metric: any) => (
          // Ensure metric.value is a number; provide a default if null/undefined
          <MetricCard 
            key={metric.id ?? metric.rowId} // Use rowId as fallback key if id is missing
            title={metric.DataPoint ?? 'Untitled'} // Use DataPoint as title
            value={typeof metric.value === 'number' ? metric.value : 0} // Pass value, default to 0 if not a number
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Accounts</h2>
          {dashboardData && <AccountsChart data={dashboardData.accounts as ChartDataRow[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Historical Data</h2>
          {/* Pass the actual data now, the component will handle transformation */}
          {dashboardData && <HistoricalDataChart data={dashboardData.historicalData as ChartDataRow[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Customer Metrics</h2>
          {dashboardData && <CustomerMetricsChart data={processedCustomerMetrics as CustomerMetricPoint[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Inventory</h2>
          {dashboardData && <InventoryChart data={dashboardData.inventory as ChartDataRow[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">POR Overview</h2>
          {dashboardData && <POROverviewChart data={dashboardData.porOverview as unknown as PORDailySalesPoint[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Site Distribution</h2>
          {dashboardData && <SiteDistributionChart data={dashboardData.siteDistribution as ChartDataRow[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">AR Aging</h2>
          {dashboardData && <ARAgingChart data={dashboardData.arAging as ChartDataRow[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Daily Orders</h2>
          {dashboardData && <DailyOrdersChart data={dashboardData.dailyOrders as ChartDataRow[]} />}
        </div>

        <div className="border rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Web Orders</h2>
          {dashboardData && <WebOrdersChart data={dashboardData.webOrders as unknown as WebOrderPoint[]} />}
        </div>
      </div>
    </main>
  );
}