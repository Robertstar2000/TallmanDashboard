'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  executeQuery,
  isServerConnected,
  getMetrics,
  getDailyOrders,
  getSiteDistribution,
  getCustomerMetrics,
  getAccounts,
  getPOR,
  getInventoryValue,
  getWebMetrics,
  getHistoricalData,
  getARAgingData,
  resetData,
  updateMetric,
  updateHistoricalData,
  updateDailyOrders,
  updateSiteDistribution,
  updateAccounts,
  updatePOR,
  updateInventoryValue,
  updateGrowthMetrics,
  getConnection,
  initialData
} from '@/lib/db';

import {
  getMode,
  setMode,
  getP21Connection,
  getPORConnection,
  setP21Connection,
  setPORConnection
} from '@/lib/state/dashboardState';

import { ARAgingData } from '@/lib/types/dashboard';
import { PlayIcon, PauseIcon, DatabaseIcon } from '@/components/icons';
import { ServerConnectionDialog } from '@/components/dialogs/ServerConnectionDialog';
import { EditableSqlCell } from "@/components/EditableSqlCell";
import { AdminControls } from '@/components/admin/AdminControls';
import { useToast } from '@/components/ui/use-toast';
import { 
  startSpreadsheetProcessing, 
  stopSpreadsheetProcessing, 
  isProcessingActive 
} from '@/lib/state/spreadsheetRunner';

interface ChartData {
  id: number;
  chartName: string;
  variableName: string;
  value: number | string;
  x_axis: string;
  calculation: string;
  serverName: string;
  sqlExpression: string;
  tableName: string;
}

interface SqlInfo {
  serverName: string;
  sqlExpression: string;
  tableName: string;
}

interface CustomerMetric {
  month: string;
  newCustomers: number;
  prospects: number;
}

interface WebMetric {
  month: string;
  W_Orders: number;
  W_Revenue: number;
}

interface PORData {
  month: string;
  newRentals: number;
  openRentals: number;
  rentalValue: number;
}

interface AccountsData {
  month: string;
  payable: number;
  overdue: number;
  receivable: number;
}

interface InventoryData {
  category: string;
  inStock: number;
  onOrder: number;
}

interface HistoricalData {
  month: string;
  p21: number;
  por: number;
  total: number;
}

interface DailyOrdersData {
  day: string;
  orders: number;
}

interface SiteDistributionData {
  name: string;
  value: number;
}

interface MetricsData {
  name: string;
  value: number;
}

class ProcessingManager {
  private timer: NodeJS.Timeout | null = null;
  private currentIndex: number | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;
  private pendingUpdates = new Map<number, number>();
  private productionValues = new Map<number, number>();
  
  constructor(
    private readonly onUpdate: (updates: Map<number, number>) => void,
    private readonly onIndexChange: (index: number | null) => void,
    private readonly onStop: () => void,
    private readonly onError: (error: { title: string; description: string }) => void
  ) {}

  async processRow(
    chartData: ChartData[],
    isProd: boolean,
    interval: number = 5000
  ) {
    if (!chartData.length) return;
    
    const index = this.currentIndex === null ? 0 : this.currentIndex;
    const row = chartData[index];
    const nextIndex = (index + 1) % chartData.length;

    if (isProd) {
      const serverType = row.serverName as 'P21' | 'POR';
      const connection = getConnection(serverType);
      
      if (!connection) {
        this.onError({
          title: "Connection Error",
          description: `No ${serverType} connection available. Please connect to the server first. Row: ${row.chartName} - ${row.variableName}`
        });
        // Set value to 0 and continue
        this.handleValueUpdate(row, 0, isProd);
        this.currentIndex = nextIndex;
        this.onIndexChange(nextIndex);
        return true;
      }

      if (row.serverName && row.tableName && row.sqlExpression) {
        try {
          const newValue = await executeQuery(
            serverType,
            row.tableName,
            row.sqlExpression
          );
          
          this.handleValueUpdate(row, newValue, isProd);

          console.log(`
            ========== SUCCESSFUL QUERY ==========
            Chart: ${row.chartName}
            Variable: ${row.variableName}
            Server: ${serverType}
            Table: ${row.tableName}
            SQL: ${row.sqlExpression}
            New Value: ${newValue}
            ====================================
          `);

        } catch (error) {
          console.error('Error executing query:', error);
          this.onError({
            title: `${serverType} Query Error`,
            description: `Failed to execute SQL query for ${row.chartName} - ${row.variableName}.
              Table: ${row.tableName}
              SQL: ${row.sqlExpression}
              Error: ${error instanceof Error ? error.message : String(error)}`
          });
          // Set value to 0 and continue
          this.handleValueUpdate(row, 0, isProd);
        }
      } else {
        this.onError({
          title: "Invalid Query Configuration",
          description: `Missing required query parameters for ${row.chartName} - ${row.variableName}.
            Server: ${row.serverName || 'Not specified'}
            Table: ${row.tableName || 'Not specified'}
            SQL: ${row.sqlExpression || 'Not specified'}`
        });
        // Set value to 0 and continue
        this.handleValueUpdate(row, 0, isProd);
      }
    }

    this.currentIndex = nextIndex;
    this.onIndexChange(nextIndex);
    
    if (isProd && nextIndex === 0) {
      this.stop();
      setTimeout(() => this.start(chartData, isProd, interval), 3600000);
      return true;
    }

    return true;
  }

  // Helper method to handle value updates consistently
  private handleValueUpdate(row: ChartData, newValue: number, isProd: boolean) {
    // Store the production value
    this.productionValues.set(row.id, newValue);
    this.pendingUpdates.set(row.id, newValue);

    // Update metrics immediately if it's a metrics row
    if (row.chartName === 'Metrics' && row.variableName) {
      updateMetric(row.variableName, newValue);
      // Force an immediate update for metrics
      this.flushUpdates(isProd);
    } else {
      // For non-metrics rows, use the normal update timeout
      if (this.updateTimeout) {
        clearTimeout(this.updateTimeout);
      }
      this.updateTimeout = setTimeout(() => this.flushUpdates(isProd), 1000);
    }
  }

  // Helper method to flush pending updates
  private flushUpdates(isProd: boolean) {
    if (this.pendingUpdates.size > 0) {
      // In production mode, merge with stored production values
      if (isProd) {
        const updates: { [key: number]: number } = {};
        this.pendingUpdates.forEach((value, id) => {
          updates[id] = value;
        });
        
        // Add any previously stored production values that aren't being updated
        this.productionValues.forEach((value, id) => {
          if (!updates[id]) {
            updates[id] = value;
          }
        });

        // Convert the object back to a Map with number keys
        const updatesMap = new Map<number, number>();
        Object.entries(updates).forEach(([key, value]) => {
          updatesMap.set(Number(key), value);
        });
        this.onUpdate(updatesMap);
      } else {
        this.onUpdate(this.pendingUpdates);
      }
      this.pendingUpdates.clear();
    }
  }

  start(chartData: ChartData[], isProd: boolean, interval: number = 5000) {
    if (isProd && !this.validateConnections(chartData)) {
      return;
    }
    
    // Clear production values when starting a new session
    if (!isProd) {
      this.productionValues.clear();
    }
    
    this.processRow(chartData, isProd, interval);
    this.timer = setInterval(() => this.processRow(chartData, isProd, interval), interval);
  }

  private validateConnections(chartData: ChartData[]): boolean {
    const requiredServers = new Set(chartData.map(row => row.serverName));
    
    for (const server of requiredServers) {
      const serverType = server as 'P21' | 'POR';
      const connection = getConnection(serverType);
      
      if (!connection) {
        this.onError({
          title: "Connection Required",
          description: `Please connect to ${serverType} server before starting. This dashboard requires both P21 and POR connections to function properly.`
        });
        return false;
      }
    }
    return true;
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.currentIndex = null;
    this.onStop();
  }

  cleanup() {
    this.stop();
    this.pendingUpdates.clear();
    this.productionValues.clear();
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = React.useState(false);
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentRowIndex, setCurrentRowIndex] = React.useState<number | null>(null);
  const [isProd, setIsProd] = React.useState(false);
  const [p21Connected, setP21Connected] = React.useState(false);
  const [porConnected, setPorConnected] = React.useState(false);
  const [errors, setErrors] = React.useState<Array<{ title: string; description: string; timestamp: string }>>([]);

  // Initialize state values after mounting
  React.useEffect(() => {
    setMounted(true);
    setIsProd(getMode());
    setP21Connected(getP21Connection());
    setPorConnected(getPORConnection());
  }, []);

  const chartDataRef = React.useRef<ChartData[]>([]);
  const currentRowIndexRef = React.useRef<number | null>(null);

  // Update refs when state changes
  React.useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  React.useEffect(() => {
    currentRowIndexRef.current = currentRowIndex;
  }, [currentRowIndex]);

  const processingManager = React.useRef<ProcessingManager | null>(null);

  // Reintroduce the initializeChartData function
  const initializeChartData = () => {
    console.log('Initializing chart data...');
    // Logic to initialize chart data
  };

  // Initialize chart data only on client side
  React.useEffect(() => {
    const initializeAllData = () => {
      console.log('Initializing all data...');
      // Reset all data to initial values
      resetData();
      
      // Force re-initialization of customer and web metrics
      localStorage.setItem('customerMetrics', JSON.stringify(initialData.customerMetrics));
      localStorage.setItem('webMetrics', JSON.stringify(initialData.webMetrics));
    };

    // First, check if we have any data in localStorage
    const hasCustomerMetrics = localStorage.getItem('customerMetrics');
    const hasWebMetrics = localStorage.getItem('webMetrics');
    const hasMetrics = localStorage.getItem('metrics');
                   
    if (!hasCustomerMetrics || !hasWebMetrics || !hasMetrics) {
      console.log('Missing required data in localStorage, initializing with default data...');
      initializeAllData();
    }

    const savedData = localStorage.getItem('spreadsheet_data');
    const savedProdData = localStorage.getItem('production_values');
    
    try {
      let initialData;
      if (savedData) {
        initialData = JSON.parse(savedData);
      } else {
        initialData = [];
        initializeChartData(); // No saved data, load initial
      }

      // If we have production values and we're in production mode, merge them
      if (savedProdData && isProd) {
        const prodValues = JSON.parse(savedProdData);
        initialData = initialData.map((row: ChartData) => {
          if (prodValues[row.id] !== undefined) {
            return { ...row, value: prodValues[row.id] };
          }
          return row;
        });
      }

      setChartData(initialData);
    } catch (error) {
      console.error('Error loading saved data:', error);
      initializeAllData(); // Fallback to initial data on any error
      initializeChartData(); // Fallback to initial chart data
    }
  }, [isProd]); // Re-run when production mode changes

  // Convert string keys to numbers
  const convertMapKeysToNumbers = (map: Map<string, number>): Map<number, number> => {
    const newMap = new Map<number, number>();
    map.forEach((value, key) => {
      newMap.set(Number(key), value);
    });
    return newMap;
  };

  // Convert number keys to strings
  const convertMapKeysToStrings = (map: Map<number, number>): Map<string, number> => {
    const newMap = new Map<string, number>();
    map.forEach((value, key) => {
      newMap.set(String(key), value);
    });
    return newMap;
  };

  // Handle chart data updates
  const handleChartDataUpdate = React.useCallback((updates: Map<number, number>) => {
    const prodValues: { [key: number]: number } = {};
    updates.forEach((value, id) => {
      prodValues[id] = value;
    });
    localStorage.setItem('production_values', JSON.stringify(prodValues));
  }, []);

  // Save updated values
  const saveUpdatedValues = React.useCallback((updates: Map<number, number>) => {
    const updatedValues: { [key: number]: number } = {};
    updates.forEach((value, id) => {
      updatedValues[id] = value;
    });
    
    const updatedData = chartData.map((row: ChartData) => {
      if (updatedValues[row.id] !== undefined) {
        return { ...row, value: updatedValues[row.id] };
      }
      return row;
    });
    
    setChartData(updatedData);
    localStorage.setItem('spreadsheet_data', JSON.stringify(updatedData));
  }, [chartData]);

  // Initialize processing manager with error handling
  React.useEffect(() => {
    if (!mounted) return;

    processingManager.current = new ProcessingManager(
      handleChartDataUpdate,  // ProcessingManager expects Map<number, number>
      setCurrentRowIndex,
      () => setIsPlaying(false),
      (error) => {
        setErrors(prev => [
          ...prev,
          { ...error, timestamp: new Date().toISOString() }
        ]);
        toast({
          title: error.title,
          description: error.description,
          variant: "destructive"
        });
      }
    );

    return () => {
      processingManager.current?.cleanup();
    };
  }, [mounted, handleChartDataUpdate]);

  // Update chart data with latest values
  const updateChartData = () => {
    const metricsData: MetricsData[] = getMetrics();
    const dailyOrdersData: DailyOrdersData[] = getDailyOrders();
    const siteDistData: SiteDistributionData[] = getSiteDistribution();
    const customerData = getCustomerMetrics();
    const accountsData: AccountsData[] = getAccounts();
    const porData: PORData[] = getPOR();
    const inventoryData: InventoryData[] = getInventoryValue();
    const webData = getWebMetrics();
    const historicalData: HistoricalData[] = getHistoricalData();

    setChartData(prev => prev.map((row: ChartData) => {
      let newValue = row.value;

      switch(row.chartName) {
        case 'Metrics':
          if (Array.isArray(metricsData)) {
            const metric = metricsData.find((m: MetricsData) => m.name === row.variableName);
            if (metric) newValue = metric.value;
          }
          break;
        case 'Daily Orders':
          if (Array.isArray(dailyOrdersData)) {
            const order = dailyOrdersData.find((d: DailyOrdersData) => d.day === row.variableName);
            if (order) newValue = order.orders;
          }
          break;
        case 'Site Distribution':
          if (Array.isArray(siteDistData)) {
            const site = siteDistData.find(s => s.name === row.variableName);
            if (site) newValue = site.value;
          }
          break;
        case 'Customer Metrics':
          if (Array.isArray(customerData)) {
            const customer = customerData.find((c: { month: string; newCustomers: number; prospects: number }) => c.month === row.x_axis);
            if (customer) newValue = customer[row.variableName as keyof { month: string; newCustomers: number; prospects: number }];
          }
          break;
        case 'Accounts':
          if (Array.isArray(accountsData)) {
            const account = accountsData.find((a: AccountsData) => a.month === row.x_axis);
            if (account) newValue = account[row.variableName as keyof AccountsData];
          }
          break;
        case 'POR':
          if (Array.isArray(porData)) {
            const por = porData.find((p: PORData) => p.month === row.x_axis);
            if (por) newValue = por[row.variableName as keyof PORData];
          }
          break;
        case 'Inventory':
          if (Array.isArray(inventoryData)) {
            const inventory = inventoryData.find((i: InventoryData) => i.category === row.x_axis);
            if (inventory) newValue = inventory[row.variableName as keyof InventoryData];
          }
          break;
        case 'Web Metrics':
          if (Array.isArray(webData)) {
            const web = webData.find((w: { month: string; W_Orders: number; W_Revenue: number }) => w.month === row.x_axis);
            if (web) newValue = web[row.variableName as keyof { month: string; W_Orders: number; W_Revenue: number }];
          }
          break;
        case 'Historical Data':
          if (Array.isArray(historicalData)) {
            const historical = historicalData.find(h => h.month === row.x_axis);
            if (historical) newValue = historical[row.variableName as keyof HistoricalData];
          }
          break;
        case 'AR Aging':
          const arAgingData = getARAgingData();
          if (Array.isArray(arAgingData)) {
            const aging = arAgingData.find((a: ARAgingData) => 
              a.name.toLowerCase().replace(/\s+/g, '_') === row.variableName
            );
            if (aging) newValue = aging.value;
          }
          break;
      }

      return { ...row, value: newValue };
    }));
  };

  // Handle play/pause state changes
  React.useEffect(() => {
    const handleProcessingStateChange = () => {
      const isActive = isProcessingActive();
      if (isActive !== isPlaying) {
        setIsPlaying(isActive);
        if (!isActive) {
          setCurrentRowIndex(null);
        }
      }
    };

    // Check initial state
    handleProcessingStateChange();

    // Set up interval to check processing state
    const interval = setInterval(handleProcessingStateChange, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle mode changes
  const handleModeChange = React.useCallback((isProduction: boolean) => {
    if (isPlaying) {
      processingManager.current?.stop();
      setIsPlaying(false);
    }
    setIsProd(isProduction);
    
    // If switching to development mode, clear production values
    if (!isProduction) {
      localStorage.removeItem('production_values');
      initializeChartData(); // Reset to test data
    }
  }, [isPlaying]);

  // Real-time updates from database
  React.useEffect(() => {
    const updateInterval = setInterval(updateChartData, 5000);
    return () => clearInterval(updateInterval);
  }, []);

  // Save spreadsheet data whenever it changes
  React.useEffect(() => {
    if (chartData.length > 0) {
      localStorage.setItem('spreadsheet_data', JSON.stringify(chartData));
    }
  }, [chartData]);

  // Keep mode state in sync
  React.useEffect(() => {
    setMode(isProd);
  }, [isProd]);

  // Save mode state when it changes
  React.useEffect(() => {
    console.log('Mode state updated:', isProd); // Debug log
    localStorage.setItem('dashboard_mode', isProd ? 'prod' : 'test');
  }, [isProd]);

  // Function to clear errors
  const clearErrors = () => setErrors([]);

  // Handle start/stop
  const handleStartStop = React.useCallback(async () => {
    try {
      if (isPlaying) {
        processingManager.current?.stop();
        await stopSpreadsheetProcessing();
        setIsPlaying(false);
        setCurrentRowIndex(null);
      } else {
        await startSpreadsheetProcessing(isProd);
        setIsPlaying(true);
        setCurrentRowIndex(0);
        processingManager.current?.start(chartData, isProd);
      }
    } catch (error) {
      console.error('Error handling start/stop:', error);
      processingManager.current?.stop();
      toast({
        title: "Processing Error",
        description: "Failed to start/stop processing. Please try again.",
        variant: "destructive"
      });
      setIsPlaying(false);
      setCurrentRowIndex(null);
    }
  }, [isPlaying, isProd, chartData]);

  // Helper function to determine server name
  const getServerName = (chartName: string, variableName: string) => {
    return chartName.includes('POR') || variableName.includes('por') ? 'POR' : 'P21';
  };

  // Helper function to get calculation based on chart and date
  const getCalculation = (chartName: string, variableName: string, relativeDate: string) => {
    switch (chartName) {
      case 'Metrics':
        return 'Sum of all orders for the current day';
      case 'Daily Orders':
        return `Sum of all orders for ${relativeDate}`;
      case 'Site Distribution':
        return 'Count of orders grouped by site location';
      case 'Customer Metrics':
        if (variableName === 'newCustomers') {
          return `Count of new customer accounts created in ${relativeDate}`;
        }
        return `Count of prospect accounts created in ${relativeDate}`;
      case 'Accounts':
        if (variableName === 'payable') {
          return `Sum of all accounts payable for ${relativeDate}`;
        }
        if (variableName === 'overdue') {
          return `Sum of overdue accounts older than 30 days for ${relativeDate}`;
        }
        return `Sum of all accounts receivable for ${relativeDate}`;
      case 'POR':
        if (variableName === 'newRentals') {
          return `Count of new rental agreements in ${relativeDate}`;
        }
        if (variableName === 'openRentals') {
          return `Count of active rental agreements in ${relativeDate}`;
        }
        return `Sum of total rental value in ${relativeDate}`;
      case 'Inventory':
        if (variableName === 'inStock') {
          return `Sum of available inventory for ${relativeDate}`;
        }
        return `Sum of ordered inventory for ${relativeDate}`;
      case 'Web Metrics':
        if (variableName === 'W_Orders') {
          return `Count of web orders in ${relativeDate}`;
        }
        return `Sum of web revenue in ${relativeDate}`;
      case 'Historical Data':
        if (variableName === 'p21') {
          return `Sum of P21 sales for ${relativeDate}`;
        }
        if (variableName === 'por') {
          return `Sum of POR revenue for ${relativeDate}`;
        }
        return `Total combined revenue (P21 + POR) for ${relativeDate}`;
      case 'AR Aging':
        return `AR ${variableName.replace('_', ' ')}`;
      default:
        return '';
    }
  };

  // Helper function to get SQL expression and table name for P21 data
  const getP21SqlInfo = (chartName: string, variableName: string, relativeDate: string): SqlInfo => {
    switch (chartName) {
      case 'Metrics':
        return {
          serverName: 'P21',
          sqlExpression: 'SELECT COUNT(*) FROM order_header WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())',
          tableName: 'order_header'
        };
      case 'Daily Orders':
        return {
          serverName: 'P21',
          sqlExpression: `SELECT COUNT(*) FROM order_header WHERE CONVERT(date, order_date) = CONVERT(date, '${relativeDate}')`,
          tableName: 'order_header'
        };
      case 'Site Distribution':
        return {
          serverName: 'P21',
          sqlExpression: 'SELECT location_id, COUNT(*) as value FROM order_header GROUP BY location_id',
          tableName: 'order_header'
        };
      case 'Customer Metrics':
        if (variableName === 'newCustomers') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT COUNT(*) FROM customer WHERE CONVERT(varchar(7), creation_date, 120) = '${relativeDate}' AND customer_type = 'CUSTOMER'`,
            tableName: 'customer'
          };
        }
        return {
          serverName: 'P21',
          sqlExpression: `SELECT COUNT(*) FROM customer WHERE CONVERT(varchar(7), creation_date, 120) = '${relativeDate}' AND customer_type = 'PROSPECT'`,
          tableName: 'customer'
        };
      case 'Accounts':
        if (variableName === 'payable') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT SUM(amount_due) FROM ap_header WHERE CONVERT(varchar(7), invoice_date, 120) = '${relativeDate}'`,
            tableName: 'ap_header'
          };
        }
        if (variableName === 'overdue') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT SUM(amount_due) FROM ap_header WHERE CONVERT(varchar(7), invoice_date, 120) = '${relativeDate}' AND DATEDIFF(day, due_date, GETDATE()) > 30`,
            tableName: 'ap_header'
          };
        }
        return {
          serverName: 'P21',
          sqlExpression: `SELECT SUM(amount_due) FROM ar_header WHERE CONVERT(varchar(7), invoice_date, 120) = '${relativeDate}'`,
          tableName: 'ar_header'
        };
      case 'Inventory':
        if (variableName === 'inStock') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT SUM(qty_on_hand) FROM item_warehouse WHERE category = '${relativeDate}'`,
            tableName: 'item_warehouse'
          };
        }
        return {
          serverName: 'P21',
          sqlExpression: `SELECT SUM(qty_ordered) FROM po_detail pd JOIN po_header ph ON pd.po_no = ph.po_no JOIN inventory i ON pd.item_id = i.item_id WHERE i.category = '${relativeDate}' AND ph.status = 'OPEN'`,
          tableName: 'po_detail, po_header, inventory'
        };
      case 'Web Metrics':
        if (variableName === 'W_Orders') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT COUNT(*) FROM order_header WHERE CONVERT(varchar(7), order_date, 120) = '${relativeDate}' AND order_source = 'WEB'`,
            tableName: 'order_header'
          };
        }
        return {
          serverName: 'P21',
          sqlExpression: `SELECT SUM(extended_amount) FROM order_line ol JOIN order_header oh ON ol.order_no = oh.order_no WHERE CONVERT(varchar(7), oh.order_date, 120) = '${relativeDate}' AND oh.order_source = 'WEB'`,
          tableName: 'order_line, order_header'
        };
      case 'Historical Data':
        if (variableName === 'p21') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT SUM(extended_amount) FROM invoice_line il JOIN invoice_header ih ON il.invoice_no = ih.invoice_no WHERE CONVERT(varchar(7), ih.invoice_date, 120) = '${relativeDate}'`,
            tableName: 'invoice_line, invoice_header'
          };
        }
        if (variableName === 'total') {
          return {
            serverName: 'P21',
            sqlExpression: `SELECT SUM(extended_amount) FROM invoice_line il JOIN invoice_header ih ON il.invoice_no = ih.invoice_no WHERE CONVERT(varchar(7), ih.invoice_date, 120) = '${relativeDate}'`,
            tableName: 'invoice_line, invoice_header'
          };
        }
        return { serverName: 'P21', sqlExpression: '', tableName: '' };
      case 'AR Aging':
        return {
          serverName: 'P21',
          sqlExpression: `
            SELECT SUM(invoice_amt) as amount
            FROM ap_hdr
            WHERE DATEDIFF(day, due_date, GETDATE()) ${
              variableName === 'current' ? '<= 30' :
              variableName === '1_30_days' ? 'BETWEEN 1 AND 30' :
              variableName === '31_60_days' ? 'BETWEEN 31 AND 60' :
              variableName === '61_90_days' ? 'BETWEEN 61 AND 90' :
              '> 90'
            }
            AND invoice_status != 'P'
          `,
          tableName: 'ap_hdr'
        };
      default:
        return { serverName: 'P21', sqlExpression: '', tableName: '' };
    }
  };

  // Helper function to get SQL expression and table name for POR data
  const getPORSqlInfo = (chartName: string, variableName: string, relativeDate: string): SqlInfo => {
    switch (chartName) {
      case 'POR':
        if (variableName === 'newRentals') {
          return {
            serverName: 'POR',
            sqlExpression: `SELECT COUNT(*) FROM tblContracts WHERE CONVERT(varchar(7), ContractDate, 120) = '${relativeDate}' AND ContractStatus = 'Out'`,
            tableName: 'tblContracts'
          };
        }
        if (variableName === 'openRentals') {
          return {
            serverName: 'POR',
            sqlExpression: `SELECT COUNT(*) FROM tblContracts WHERE CONVERT(varchar(7), ContractDate, 120) = '${relativeDate}' AND ContractStatus NOT IN ('Closed', 'Cancelled')`,
            tableName: 'tblContracts'
          };
        }
        return {
          serverName: 'POR',
          sqlExpression: `SELECT SUM(TotalAmount) FROM tblContracts WHERE CONVERT(varchar(7), ContractDate, 120) = '${relativeDate}'`,
          tableName: 'tblContracts'
        };
      case 'Historical Data':
        if (variableName === 'por') {
          return {
            serverName: 'POR',
            sqlExpression: `SELECT SUM(TotalAmount) FROM tblContracts WHERE CONVERT(varchar(7), ContractDate, 120) = '${relativeDate}' AND ContractStatus NOT IN ('Cancelled')`,
            tableName: 'tblContracts'
          };
        }
        return { serverName: 'POR', sqlExpression: '', tableName: '' };
      default:
        return { serverName: 'POR', sqlExpression: '', tableName: '' };
    }
  };

  // Helper function to get x_axis value based on chart and date
  const getXAxisValue = (chartName: string, date: string, variableName: string) => {
    switch (chartName) {
      case 'Metrics':
        return 'Today';
      case 'Daily Orders':
        return `${date} - Daily Orders`;
      case 'Site Distribution':
        return `${date} - Site`;
      case 'Customer Metrics':
        return `${date} - ${variableName === 'newCustomers' ? 'New Customers' : 'Prospects'}`;
      case 'Accounts':
        if (variableName === 'payable') {
          return `${date} - Accounts Payable`;
        }
        if (variableName === 'overdue') {
          return `${date} - Overdue Accounts`;
        }
        return `${date} - Accounts Receivable`;
      case 'POR':
        if (variableName === 'newRentals') {
          return `${date} - New Rentals`;
        }
        if (variableName === 'openRentals') {
          return `${date} - Open Rentals`;
        }
        return `${date} - Rental Value`;
      case 'Inventory':
        return `${date} - ${variableName === 'inStock' ? 'In Stock' : 'On Order'}`;
      case 'Web Metrics':
        return `${date} - ${variableName === 'W_Orders' ? 'Web Orders' : 'Web Revenue'}`;
      case 'Historical Data':
        if (variableName === 'p21') {
          return `${date} - P21 Sales`;
        }
        if (variableName === 'por') {
          return `${date} - POR Revenue`;
        }
        return `${date} - Total Revenue`;
      case 'AR Aging':
        return new Date().toISOString().slice(0, 10);
      default:
        return date;
    }
  };

  // Function to handle server connections
  const handleServerConnection = React.useCallback((serverType: 'P21' | 'POR', isConnected: boolean) => {
    if (serverType === 'P21') {
      setP21Connection(isConnected);
      setP21Connected(isConnected);
    } else {
      setPORConnection(isConnected);
      setPorConnected(isConnected);
    }
  }, []);

  // Function to handle SQL expression updates
  const handleSqlUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map((row: ChartData) => 
        row.id === id ? { ...row, sqlExpression: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle Table Name updates
  const handleTableNameUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map((row: ChartData) => 
        row.id === id ? { ...row, tableName: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle X-axis updates
  const handleXAxisUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map((row: ChartData) => 
        row.id === id ? { ...row, x_axis: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle Calculation updates
  const handleCalculationUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map((row: ChartData) => 
        row.id === id ? { ...row, calculation: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle Server Name updates
  const handleServerNameUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map((row: ChartData) => 
        row.id === id ? { ...row, serverName: newValue } : row
      );
      return newData;
    });
  };

  const handleRestoreTestValues = React.useCallback(() => {
    try {
      // Stop any ongoing processing
      if (isPlaying) {
        processingManager.current?.stop();
        setIsPlaying(false);
      }

      // Reset data to initial values
      resetData();
      
      // Re-initialize chart data with test values
      initializeChartData();
      
      toast({
        title: "Test Values Restored",
        description: "All values have been reset to their initial test state.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error restoring test values:', error);
      toast({
        title: "Error",
        description: "Failed to restore test values. Please try again.",
        variant: "destructive",
      });
    }
  }, [isPlaying]);

  const handleRefresh = React.useCallback(() => {
    try {
      // Stop any ongoing processing
      if (isPlaying) {
        processingManager.current?.stop();
        setIsPlaying(false);
      }

      // Reload data from localStorage
      const savedData = localStorage.getItem('spreadsheet_data');
      if (savedData) {
        setChartData(JSON.parse(savedData));
      }

      toast({
        title: "Data Refreshed",
        description: "Data has been reloaded from storage.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh data. Please try again.",
        variant: "destructive",
      });
    }
  }, [isPlaying]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        <div className="flex items-center space-x-2">
          <AdminControls
            onRefresh={handleRefresh}
            onRestoreTestValues={handleRestoreTestValues}
            isRealTime={isProd}
            onTimeSourceChange={handleModeChange}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleStartStop}
            className={cn(
              "h-8 w-8",
              isPlaying && "bg-accent"
            )}
          >
            {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </Button>
          <ServerConnectionDialog
            serverType="P21"
            onConnectionChange={(isConnected) => handleServerConnection('P21', isConnected)}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className={`h-7 text-xs ${
                  p21Connected 
                    ? 'bg-green-700 hover:bg-green-800 text-white border-green-700' 
                    : 'bg-red-700 hover:bg-red-800 text-white border-red-700'
                }`}
              >
                <DatabaseIcon className="h-3 w-3 mr-1" />
                P21 {p21Connected ? 'Connected' : 'Disconnected'}
              </Button>
            }
          />
          <ServerConnectionDialog
            serverType="POR"
            onConnectionChange={(isConnected) => handleServerConnection('POR', isConnected)}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className={`h-7 text-xs ${
                  porConnected 
                    ? 'bg-green-700 hover:bg-green-800 text-white border-green-700' 
                    : 'bg-red-700 hover:bg-red-800 text-white border-red-700'
                }`}
              >
                <DatabaseIcon className="h-3 w-3 mr-1" />
                POR {porConnected ? 'Connected' : 'Disconnected'}
              </Button>
            }
          />
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            size="sm"
            className="h-7 text-xs hover:bg-gray-100"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-red-800 font-semibold">Processing Errors</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearErrors}
              className="text-red-800 hover:text-red-900 hover:bg-red-100"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="bg-white p-3 rounded border border-red-200">
                <div className="flex justify-between">
                  <span className="font-medium text-red-800">{error.title}</span>
                  <span className="text-sm text-gray-500">{error.timestamp}</span>
                </div>
                <p className="text-sm text-red-700 whitespace-pre-line mt-1">
                  {error.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-2">
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              <TableHead className="p-1 whitespace-normal w-[3%]">ID</TableHead>
              <TableHead className="p-1 whitespace-normal w-[8%]">Chart Name</TableHead>
              <TableHead className="p-1 whitespace-normal w-[8%]">Variable Name</TableHead>
              <TableHead className="p-1 whitespace-normal w-[7%]">Value</TableHead>
              <TableHead className="p-1 whitespace-normal w-[10%]">X_axis</TableHead>
              <TableHead className="p-1 whitespace-normal w-[12%]">Calculation</TableHead>
              <TableHead className="p-1 whitespace-normal w-[7%]">Server Name</TableHead>
              <TableHead className="p-1 whitespace-normal w-[35%]">SQL Expression</TableHead>
              <TableHead className="p-1 whitespace-normal w-[10%]">Table Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chartData.map((row: ChartData, index) => (
              <TableRow 
                key={row.id} 
                className={`text-[10px] ${
                  currentRowIndex === index 
                    ? 'bg-blue-100 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <TableCell className="p-1 whitespace-normal">{row.id}</TableCell>
                <TableCell className="p-1 whitespace-normal">{row.chartName}</TableCell>
                <TableCell className="p-1 whitespace-normal">{row.variableName}</TableCell>
                <TableCell className="p-1 whitespace-normal">{row.value}</TableCell>
                <TableCell className="p-1 whitespace-normal">
                  <EditableSqlCell
                    value={row.x_axis}
                    onSave={(newValue) => handleXAxisUpdate(row.id, newValue)}
                  />
                </TableCell>
                <TableCell className="p-1 whitespace-normal">
                  <EditableSqlCell
                    value={row.calculation}
                    onSave={(newValue) => handleCalculationUpdate(row.id, newValue)}
                  />
                </TableCell>
                <TableCell className="p-1 whitespace-normal">
                  <EditableSqlCell
                    value={row.serverName}
                    onSave={(newValue) => handleServerNameUpdate(row.id, newValue)}
                  />
                </TableCell>
                <TableCell className="p-1 whitespace-normal">
                  <EditableSqlCell
                    value={row.sqlExpression}
                    onSave={(newValue) => handleSqlUpdate(row.id, newValue)}
                  />
                </TableCell>
                <TableCell className="p-1 whitespace-normal">
                  <EditableSqlCell
                    value={row.tableName}
                    onSave={(newValue) => handleTableNameUpdate(row.id, newValue)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
