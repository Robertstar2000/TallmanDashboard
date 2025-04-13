'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Dashboard } from '@/components/dashboard/Dashboard';
import { useQueryStatusStore } from '@/lib/stores/queryStatusStore';
export default function DashboardClient() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    // Get query running status from the global store
    const isRunning = useQueryStatusStore(state => state.isRunning);
    const isPolling = useQueryStatusStore(state => state.isPolling);
    // Check if we need to restart polling when dashboard loads
    useEffect(() => {
        const checkRunningStatus = () => __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if there's an active background process
                const response = yield fetch('/api/admin/run/status');
                if (response.ok) {
                    const { status } = yield response.json();
                    // If the process is running but we're not polling, restart polling
                    if ((status === 'running' || status === 'processing') && !isPolling) {
                        console.log('Background process is running but polling is not active. Restarting polling...');
                        useQueryStatusStore.getState().startPolling();
                    }
                }
            }
            catch (error) {
                console.error('Error checking background process status:', error);
            }
        });
        checkRunningStatus();
    }, [isPolling]);
    useEffect(() => {
        const fetchData = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                // Add timestamp to prevent caching issues
                const response = yield fetch('/api/dashboard/data?t=' + new Date().getTime());
                if (!response.ok) {
                    // Try to get detailed error information from the response
                    let errorMessage = 'Failed to fetch dashboard data';
                    try {
                        const errorData = yield response.json();
                        console.error('Server error details:', errorData);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                    catch (parseError) {
                        console.error('Could not parse error response:', parseError);
                    }
                    throw new Error(errorMessage);
                }
                // Parse the response
                const result = yield response.json();
                console.log('Dashboard API response:', result);
                // Log detailed information about the data
                console.log('Key Metrics:', ((_a = result.metrics) === null || _a === void 0 ? void 0 : _a.length) || 0);
                console.log('Historical Data:', ((_b = result.historicalData) === null || _b === void 0 ? void 0 : _b.length) || 0);
                console.log('Accounts Data:', ((_c = result.accounts) === null || _c === void 0 ? void 0 : _c.length) || 0);
                console.log('Customer Metrics:', ((_d = result.customerMetrics) === null || _d === void 0 ? void 0 : _d.length) || 0);
                console.log('Inventory Data:', ((_e = result.inventory) === null || _e === void 0 ? void 0 : _e.length) || 0);
                console.log('POR Overview:', ((_f = result.porOverview) === null || _f === void 0 ? void 0 : _f.length) || 0);
                console.log('Site Distribution:', ((_g = result.siteDistribution) === null || _g === void 0 ? void 0 : _g.length) || 0);
                // Verify data has values
                if (((_h = result.metrics) === null || _h === void 0 ? void 0 : _h.length) === 0) {
                    console.warn('No Key Metrics data available');
                }
                if (((_j = result.historicalData) === null || _j === void 0 ? void 0 : _j.length) === 0) {
                    console.warn('No Historical Data available');
                }
                // The API now returns the dashboard data directly
                setData(result);
            }
            catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'Failed to load dashboard data',
                    variant: 'destructive',
                });
            }
            finally {
                setLoading(false);
            }
        });
        fetchData();
        // Dynamic refresh interval - every 2 seconds when queries are running, otherwise every 10 seconds
        const refreshInterval = isRunning ? 2000 : 10000;
        console.log(`Setting dashboard refresh interval to ${refreshInterval}ms (isRunning: ${isRunning})`);
        const interval = setInterval(fetchData, refreshInterval);
        // If the running state changes, clear the old interval
        return () => clearInterval(interval);
    }, [toast, isRunning]); // Re-setup interval when isRunning changes
    if (loading) {
        return (<div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading dashboard data...</span>
      </div>);
    }
    if (!data) {
        return (<div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>No dashboard data available</p>
        </div>
      </div>);
    }
    return (<div className="w-full">
      <Dashboard data={data} loading={loading}/>
    </div>);
}
