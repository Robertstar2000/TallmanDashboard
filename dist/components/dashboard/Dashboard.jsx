'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricsSection } from './MetricsSection';
import { ChartsSection } from './ChartsSection';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
export function Dashboard({ data, loading = false }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const [error, setError] = useState(null);
    const router = useRouter();
    useEffect(() => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (data) {
            console.log('Dashboard received data:', {
                metrics: ((_a = data.metrics) === null || _a === void 0 ? void 0 : _a.length) || 0,
                historicalData: ((_b = data.historicalData) === null || _b === void 0 ? void 0 : _b.length) || 0,
                accounts: ((_c = data.accounts) === null || _c === void 0 ? void 0 : _c.length) || 0,
                customerMetrics: ((_d = data.customerMetrics) === null || _d === void 0 ? void 0 : _d.length) || 0,
                inventory: ((_e = data.inventory) === null || _e === void 0 ? void 0 : _e.length) || 0,
                porOverview: ((_f = data.porOverview) === null || _f === void 0 ? void 0 : _f.length) || 0,
                siteDistribution: ((_g = data.siteDistribution) === null || _g === void 0 ? void 0 : _g.length) || 0,
                arAging: ((_h = data.arAging) === null || _h === void 0 ? void 0 : _h.length) || 0,
                dailyOrders: ((_j = data.dailyOrders) === null || _j === void 0 ? void 0 : _j.length) || 0,
                webOrders: ((_k = data.webOrders) === null || _k === void 0 ? void 0 : _k.length) || 0
            });
        }
    }, [data]);
    // Display error state
    if (error) {
        return (<div className="w-full p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4"/>
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>);
    }
    // Show loading state
    if (loading || !data) {
        return (<div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground"/>
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>);
    }
    // Ensure all data arrays are properly initialized
    const processedData = {
        historicalData: ((_a = data.historicalData) === null || _a === void 0 ? void 0 : _a.map(item => ({
            id: item.id || `hist-${Math.random().toString(36).substr(2, 9)}`,
            date: item.date || '',
            sales: typeof item.sales === 'number' ? item.sales : 0,
            orders: typeof item.orders === 'number' ? item.orders : 0,
            combined: typeof item.combined === 'number' ? item.combined : 0
        }))) || [],
        accounts: ((_b = data.accounts) === null || _b === void 0 ? void 0 : _b.map(item => ({
            id: item.id || `acc-${Math.random().toString(36).substr(2, 9)}`,
            date: item.date || '',
            payable: typeof item.payable === 'number' ? item.payable : 0,
            receivable: typeof item.receivable === 'number' ? item.receivable : 0,
            overdue: typeof item.overdue === 'number' ? item.overdue : 0
        }))) || [],
        customerMetrics: ((_c = data.customerMetrics) === null || _c === void 0 ? void 0 : _c.map(item => ({
            id: item.id || `cust-${Math.random().toString(36).substr(2, 9)}`,
            date: item.date || '',
            newCustomers: typeof item.newCustomers === 'number' ? item.newCustomers : 0,
            returning: 0 // Ensure returning is always a number
        }))) || [],
        inventory: ((_d = data.inventory) === null || _d === void 0 ? void 0 : _d.map(item => ({
            id: item.id || `inv-${Math.random().toString(36).substr(2, 9)}`,
            department: item.department || '',
            inStock: typeof item.inStock === 'number' ? item.inStock : 0,
            onOrder: typeof item.onOrder === 'number' ? item.onOrder : 0
        }))) || [],
        porOverview: ((_e = data.porOverview) === null || _e === void 0 ? void 0 : _e.map(item => ({
            id: item.id || `por-${Math.random().toString(36).substr(2, 9)}`,
            date: item.date || '',
            newRentals: typeof item.newRentals === 'number' ? item.newRentals : 0,
            openRentals: typeof item.openRentals === 'number' ? item.openRentals : 0,
            rentalValue: typeof item.rentalValue === 'number' ? item.rentalValue : 0
        }))) || [],
        siteDistribution: ((_f = data.siteDistribution) === null || _f === void 0 ? void 0 : _f.map(item => ({
            id: item.id || `site-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || '',
            value: typeof item.value === 'number' ? item.value : 0
        }))) || [],
        arAging: ((_g = data.arAging) === null || _g === void 0 ? void 0 : _g.map(item => {
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
        })) || [],
        dailyOrders: ((_h = data.dailyOrders) === null || _h === void 0 ? void 0 : _h.map(item => ({
            id: item.id || `daily-${Math.random().toString(36).substr(2, 9)}`,
            date: item.date || '',
            orders: typeof item.orders === 'number' ? item.orders : 0
        }))) || [],
        webOrders: ((_j = data.webOrders) === null || _j === void 0 ? void 0 : _j.map(item => ({
            id: item.id || `web-${Math.random().toString(36).substr(2, 9)}`,
            date: item.date || '',
            orders: typeof item.orders === 'number' ? item.orders : 0,
            revenue: typeof item.revenue === 'number' ? item.revenue : 0
        }))) || []
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
    return (<div className="w-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Metrics section */}
        <MetricsSection metrics={data.metrics || []}/>
        
        {/* Charts section */}
        <ChartsSection data={processedData}/>
      </div>
    </div>);
}
