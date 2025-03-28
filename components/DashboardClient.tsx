'use client';

import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { DashboardData } from '@/lib/types/dashboard';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useQueryStatusStore } from '@/lib/stores/queryStatusStore';

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Get query running status from the global store
  const isRunning = useQueryStatusStore(state => state.isRunning);
  const isPolling = useQueryStatusStore(state => state.isPolling);

  // Check if we need to restart polling when dashboard loads
  useEffect(() => {
    const checkRunningStatus = async () => {
      try {
        // Check if there's an active background process
        const response = await fetch('/api/admin/run/status');
        if (response.ok) {
          const { status } = await response.json();
          
          // If the process is running but we're not polling, restart polling
          if ((status === 'running' || status === 'processing') && !isPolling) {
            console.log('Background process is running but polling is not active. Restarting polling...');
            useQueryStatusStore.getState().startPolling();
          }
        }
      } catch (error) {
        console.error('Error checking background process status:', error);
      }
    };
    
    checkRunningStatus();
  }, [isPolling]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add timestamp to prevent caching issues
        const response = await fetch('/api/dashboard/data?t=' + new Date().getTime());
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        // Parse the response
        const result = await response.json();
        console.log('Dashboard API response:', result);
        
        // Log detailed information about the data
        console.log('Key Metrics:', result.metrics?.length || 0);
        console.log('Historical Data:', result.historicalData?.length || 0);
        console.log('Accounts Data:', result.accounts?.length || 0);
        console.log('Customer Metrics:', result.customerMetrics?.length || 0);
        console.log('Inventory Data:', result.inventory?.length || 0);
        console.log('POR Overview:', result.porOverview?.length || 0);
        console.log('Site Distribution:', result.siteDistribution?.length || 0);
        
        // Verify data has values
        if (result.metrics?.length === 0) {
          console.warn('No Key Metrics data available');
        }
        if (result.historicalData?.length === 0) {
          console.warn('No Historical Data available');
        }
        
        // The API now returns the dashboard data directly
        setData(result);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Dynamic refresh interval - every 2 seconds when queries are running, otherwise every 10 seconds
    const refreshInterval = isRunning ? 2000 : 10000;
    console.log(`Setting dashboard refresh interval to ${refreshInterval}ms (isRunning: ${isRunning})`);
    
    const interval = setInterval(fetchData, refreshInterval);
    
    // If the running state changes, clear the old interval
    return () => clearInterval(interval);
    
  }, [toast, isRunning]); // Re-setup interval when isRunning changes

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Dashboard data={data} loading={loading} />
    </div>
  );
}
