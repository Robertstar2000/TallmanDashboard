'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
  updateGrowthMetrics
} from '@/lib/db';
import { ARAgingData } from '@/lib/types/dashboard';
import { PlayIcon, PauseIcon, DatabaseIcon } from '@/components/icons';
import { ServerConnectionDialog } from '@/components/dialogs/ServerConnectionDialog';
import { EditableSqlCell } from "@/components/EditableSqlCell";

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

export default function AdminPage() {
  const router = useRouter();
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentRowIndex, setCurrentRowIndex] = React.useState<number | null>(null);
  const [isProd, setIsProd] = React.useState(false);
  const [p21Connected, setP21Connected] = React.useState(false);
  const [porConnected, setPorConnected] = React.useState(false);

  // Initialize chart data only on client side
  React.useEffect(() => {
    // First, check if we have any data in localStorage
    const hasData = localStorage.getItem('customerMetrics') && 
                   localStorage.getItem('webMetrics') && 
                   localStorage.getItem('metrics');
                   
    if (!hasData) {
      console.log('No data found in localStorage, initializing with default data...');
      resetData(); // Reset all data to initial values
    }

    const savedData = localStorage.getItem('spreadsheet_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setChartData(parsedData);
      } catch (error) {
        console.error('Error loading saved spreadsheet data:', error);
        initializeChartData(); // Fallback to initial data
      }
    } else {
      initializeChartData(); // No saved data, load initial
    }
  }, []);

  // Function to initialize chart data
  const initializeChartData = React.useCallback(() => {
    const tempData: ChartData[] = [];
    
    if (typeof window === 'undefined') return; // Guard against server-side execution

    try {
      // Get data from various sources
      const metricsData: MetricsData[] = getMetrics();
      const dailyOrdersData: DailyOrdersData[] = getDailyOrders();
      const siteDistData: SiteDistributionData[] = getSiteDistribution();
      const customerData = getCustomerMetrics();
      const accountsData: AccountsData[] = getAccounts();
      const porData: PORData[] = getPOR();
      const inventoryData: InventoryData[] = getInventoryValue();
      const webData = getWebMetrics();
      const historicalData: HistoricalData[] = getHistoricalData();
      const arAgingData: ARAgingData[] = getARAgingData();

      // Process metrics data
      let idCounter = 1;  // Add counter for unique IDs
      if (Array.isArray(metricsData)) {
        metricsData.forEach((metric: MetricsData) => {
          const sqlInfo = getP21SqlInfo('Metrics', metric.name, 'Current');
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Metrics',
            variableName: metric.name,
            value: metric.value,
            x_axis: getXAxisValue('Metrics', 'Current', metric.name),
            calculation: getCalculation('Metrics', metric.name, 'Current'),
            serverName: sqlInfo.serverName,
            sqlExpression: sqlInfo.sqlExpression,
            tableName: sqlInfo.tableName
          });
        });
      }

      // Add daily orders data
      if (Array.isArray(dailyOrdersData)) {
        dailyOrdersData.forEach(order => {
          const sqlInfo = getP21SqlInfo('Daily Orders', 'orders', order.day);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Daily Orders',
            variableName: 'orders',
            value: order.orders,
            x_axis: getXAxisValue('Daily Orders', order.day, 'orders'),
            calculation: getCalculation('Daily Orders', 'orders', order.day),
            serverName: sqlInfo.serverName,
            sqlExpression: sqlInfo.sqlExpression,
            tableName: sqlInfo.tableName
          });
        });
      }

      // Add site distribution data
      if (Array.isArray(siteDistData)) {
        siteDistData.forEach(site => {
          const sqlInfo = getP21SqlInfo('Site Distribution', 'value', site.name);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Site Distribution',
            variableName: 'value',
            value: site.value,
            x_axis: getXAxisValue('Site Distribution', site.name, 'value'),
            calculation: getCalculation('Site Distribution', 'value', site.name),
            serverName: sqlInfo.serverName,
            sqlExpression: sqlInfo.sqlExpression,
            tableName: sqlInfo.tableName
          });
        });
      }

      // Add customer metrics data
      if (Array.isArray(customerData)) {
        customerData.forEach(customer => {
          const sqlInfoNewCustomers = getP21SqlInfo('Customer Metrics', 'newCustomers', customer.month);
          tempData.push({
            id: idCounter++,
            chartName: 'Customer Metrics',
            variableName: 'newCustomers',
            value: customer.newCustomers,
            x_axis: getXAxisValue('Customer Metrics', customer.month, 'newCustomers'),
            calculation: getCalculation('Customer Metrics', 'newCustomers', customer.month),
            serverName: sqlInfoNewCustomers.serverName,
            sqlExpression: sqlInfoNewCustomers.sqlExpression,
            tableName: sqlInfoNewCustomers.tableName
          });
          
          const sqlInfoProspects = getP21SqlInfo('Customer Metrics', 'prospects', customer.month);
          tempData.push({
            id: idCounter++,
            chartName: 'Customer Metrics',
            variableName: 'prospects',
            value: customer.prospects,
            x_axis: getXAxisValue('Customer Metrics', customer.month, 'prospects'),
            calculation: getCalculation('Customer Metrics', 'prospects', customer.month),
            serverName: sqlInfoProspects.serverName,
            sqlExpression: sqlInfoProspects.sqlExpression,
            tableName: sqlInfoProspects.tableName
          });
        });
      }

      // Add accounts data
      if (Array.isArray(accountsData)) {
        accountsData.forEach(account => {
          const sqlInfo1 = getP21SqlInfo('Accounts', 'payable', account.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Accounts',
            variableName: 'payable',
            value: account.payable,
            x_axis: getXAxisValue('Accounts', account.month, 'payable'),
            calculation: getCalculation('Accounts', 'payable', account.month),
            serverName: sqlInfo1.serverName,
            sqlExpression: sqlInfo1.sqlExpression,
            tableName: sqlInfo1.tableName
          });
          const sqlInfo2 = getP21SqlInfo('Accounts', 'overdue', account.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Accounts',
            variableName: 'overdue',
            value: account.overdue,
            x_axis: getXAxisValue('Accounts', account.month, 'overdue'),
            calculation: getCalculation('Accounts', 'overdue', account.month),
            serverName: sqlInfo2.serverName,
            sqlExpression: sqlInfo2.sqlExpression,
            tableName: sqlInfo2.tableName
          });
          const sqlInfo3 = getP21SqlInfo('Accounts', 'receivable', account.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Accounts',
            variableName: 'receivable',
            value: account.receivable,
            x_axis: getXAxisValue('Accounts', account.month, 'receivable'),
            calculation: getCalculation('Accounts', 'receivable', account.month),
            serverName: sqlInfo3.serverName,
            sqlExpression: sqlInfo3.sqlExpression,
            tableName: sqlInfo3.tableName
          });
        });
      }

      // Add POR data
      if (Array.isArray(porData)) {
        porData.forEach(por => {
          const sqlInfo1 = getPORSqlInfo('POR', 'newRentals', por.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'POR',
            variableName: 'newRentals',
            value: por.newRentals,
            x_axis: getXAxisValue('POR', por.month, 'newRentals'),
            calculation: getCalculation('POR', 'newRentals', por.month),
            serverName: sqlInfo1.serverName,
            sqlExpression: sqlInfo1.sqlExpression,
            tableName: sqlInfo1.tableName
          });
          const sqlInfo2 = getPORSqlInfo('POR', 'openRentals', por.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'POR',
            variableName: 'openRentals',
            value: por.openRentals,
            x_axis: getXAxisValue('POR', por.month, 'openRentals'),
            calculation: getCalculation('POR', 'openRentals', por.month),
            serverName: sqlInfo2.serverName,
            sqlExpression: sqlInfo2.sqlExpression,
            tableName: sqlInfo2.tableName
          });
          const sqlInfo3 = getPORSqlInfo('POR', 'rentalValue', por.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'POR',
            variableName: 'rentalValue',
            value: por.rentalValue,
            x_axis: getXAxisValue('POR', por.month, 'rentalValue'),
            calculation: getCalculation('POR', 'rentalValue', por.month),
            serverName: sqlInfo3.serverName,
            sqlExpression: sqlInfo3.sqlExpression,
            tableName: sqlInfo3.tableName
          });
        });
      }

      // Process AR aging data
      if (arAgingData && Array.isArray(arAgingData)) {
        arAgingData.forEach((aging: ARAgingData) => {
          const sqlInfo = getP21SqlInfo('AR Aging', aging.name, aging.date);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'AR Aging',
            variableName: aging.name.toLowerCase().replace(/\s+/g, '_'),
            value: aging.value,
            x_axis: aging.date,
            calculation: getCalculation('AR Aging', aging.name, aging.date),
            serverName: sqlInfo.serverName,
            sqlExpression: sqlInfo.sqlExpression,
            tableName: sqlInfo.tableName
          });
        });
      }

      // Add inventory data
      const filteredInventoryData = inventoryData.filter(item => item.category !== '108' && item.category !== '109');
      if (Array.isArray(filteredInventoryData)) {
        filteredInventoryData.forEach(inventory => {
          const sqlInfo1 = getP21SqlInfo('Inventory', 'inStock', inventory.category);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Inventory',
            variableName: 'inStock',
            value: inventory.inStock,
            x_axis: getXAxisValue('Inventory', inventory.category, 'inStock'),
            calculation: getCalculation('Inventory', 'inStock', inventory.category),
            serverName: sqlInfo1.serverName,
            sqlExpression: sqlInfo1.sqlExpression,
            tableName: sqlInfo1.tableName
          });
          const sqlInfo2 = getP21SqlInfo('Inventory', 'onOrder', inventory.category);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Inventory',
            variableName: 'onOrder',
            value: inventory.onOrder,
            x_axis: getXAxisValue('Inventory', inventory.category, 'onOrder'),
            calculation: getCalculation('Inventory', 'onOrder', inventory.category),
            serverName: sqlInfo2.serverName,
            sqlExpression: sqlInfo2.sqlExpression,
            tableName: sqlInfo2.tableName
          });
        });
      }

      // Add web metrics data
      if (Array.isArray(webData)) {
        webData.forEach(web => {
          const sqlInfoOrders = getP21SqlInfo('Web Orders', 'W_Orders', web.month);
          tempData.push({
            id: idCounter++,
            chartName: 'Web Orders',
            variableName: 'W_Orders',
            value: web.W_Orders,
            x_axis: getXAxisValue('Web Orders', web.month, 'W_Orders'),
            calculation: getCalculation('Web Orders', 'W_Orders', web.month),
            serverName: sqlInfoOrders.serverName,
            sqlExpression: sqlInfoOrders.sqlExpression,
            tableName: sqlInfoOrders.tableName
          });

          const sqlInfoRevenue = getP21SqlInfo('Web Orders', 'W_Revenue', web.month);
          tempData.push({
            id: idCounter++,
            chartName: 'Web Orders',
            variableName: 'W_Revenue',
            value: web.W_Revenue,
            x_axis: getXAxisValue('Web Orders', web.month, 'W_Revenue'),
            calculation: getCalculation('Web Orders', 'W_Revenue', web.month),
            serverName: sqlInfoRevenue.serverName,
            sqlExpression: sqlInfoRevenue.sqlExpression,
            tableName: sqlInfoRevenue.tableName
          });
        });
      }

      // Add historical data
      if (Array.isArray(historicalData)) {
        historicalData.forEach(history => {
          const sqlInfo1 = getP21SqlInfo('Historical Data', 'p21', history.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Historical Data',
            variableName: 'p21',
            value: history.p21,
            x_axis: getXAxisValue('Historical Data', history.month, 'p21'),
            calculation: getCalculation('Historical Data', 'p21', history.month),
            serverName: sqlInfo1.serverName,
            sqlExpression: sqlInfo1.sqlExpression,
            tableName: sqlInfo1.tableName
          });
          const sqlInfo2 = getPORSqlInfo('Historical Data', 'por', history.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Historical Data',
            variableName: 'por',
            value: history.por,
            x_axis: getXAxisValue('Historical Data', history.month, 'por'),
            calculation: getCalculation('Historical Data', 'por', history.month),
            serverName: sqlInfo2.serverName,
            sqlExpression: sqlInfo2.sqlExpression,
            tableName: sqlInfo2.tableName
          });
          const sqlInfo3 = getP21SqlInfo('Historical Data', 'total', history.month);
          tempData.push({
            id: idCounter++,  // Add unique ID
            chartName: 'Historical Data',
            variableName: 'total',
            value: history.total,
            x_axis: getXAxisValue('Historical Data', history.month, 'total'),
            calculation: getCalculation('Historical Data', 'total', history.month),
            serverName: sqlInfo3.serverName,
            sqlExpression: sqlInfo3.sqlExpression,
            tableName: sqlInfo3.tableName
          });
        });
      }

      // Set the chart data
      setChartData(tempData);
    } catch (error) {
      console.error('Error initializing chart data:', error);
    }
  }, []);

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

    setChartData(prev => prev.map(row => {
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

  // Helper function to determine server name
  const getServerName = (chartName: string, variableName: string) => {
    return chartName.includes('POR') || variableName.includes('por') ? 'POR' : 'P21';
  };

  // Helper function to get calculation based on chart and variable
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
  const handleServerConnection = (serverType: 'P21' | 'POR', isConnected: boolean) => {
    if (serverType === 'P21') {
      setP21Connected(isConnected);
    } else {
      setPorConnected(isConnected);
    }
  };

  // Function to handle SQL expression updates
  const handleSqlUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map(row => 
        row.id === id ? { ...row, sqlExpression: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle Table Name updates
  const handleTableNameUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map(row => 
        row.id === id ? { ...row, tableName: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle X-axis updates
  const handleXAxisUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map(row => 
        row.id === id ? { ...row, x_axis: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle Calculation updates
  const handleCalculationUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map(row => 
        row.id === id ? { ...row, calculation: newValue } : row
      );
      return newData;
    });
  };

  // Function to handle Server Name updates
  const handleServerNameUpdate = (id: number, newValue: string) => {
    setChartData(prev => {
      const newData = prev.map(row => 
        row.id === id ? { ...row, serverName: newValue } : row
      );
      return newData;
    });
  };

  // Timer effect for row cycling
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying && chartData.length > 0) {
      timer = setInterval(async () => {
        setCurrentRowIndex((prevIndex) => {
          if (prevIndex === null) return 0;
          const nextIndex = (prevIndex + 1) % chartData.length;
          
          // ========== PRODUCTION MODE SQL EXECUTION ==========
          // Check if we're in production mode with both servers connected
          if (isProd && p21Connected && porConnected) {
            const currentRow = chartData[prevIndex];
            
            // Only execute if we have all required fields
            if (currentRow.serverName && currentRow.tableName && currentRow.sqlExpression) {
              // Execute the SQL query and update the value
              executeQuery(
                currentRow.serverName as 'P21' | 'POR',
                currentRow.tableName,
                currentRow.sqlExpression
              ).then(newValue => {
                // Update the database with the new value
                if (currentRow.chartName === 'Metrics' && currentRow.variableName) {
                  updateMetric(currentRow.variableName, newValue);
                }
                // Note: Add similar update logic for other chart types as needed
                
                // Update the row's value in the spreadsheet
                setChartData(prev => prev.map(row => 
                  row.id === currentRow.id ? { ...row, value: newValue } : row
                ));

                console.log(`
                  ========== SQL EXECUTION REPORT ==========
                  Time: ${new Date().toISOString()}
                  Mode: PRODUCTION
                  Server: ${currentRow.serverName}
                  Table: ${currentRow.tableName}
                  SQL: ${currentRow.sqlExpression}
                  New Value: ${newValue}
                  =======================================
                `);
              });
            }
          }
          
          // If in prod mode and we're at the end of the list
          if (isProd && nextIndex === 0) {
            // Clear the current interval
            if (timer) clearInterval(timer);
            // Wait for 1 hour before starting again
            setTimeout(() => {
              setCurrentRowIndex(0);
              // Restart the normal interval
              timer = setInterval(() => {
                setCurrentRowIndex(prev => (prev === null ? 0 : (prev + 1) % chartData.length));
              }, 3000);
            }, 3600000); // 1 hour in milliseconds
            return null; // Pause the highlighting
          }
          return nextIndex;
        });
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, chartData.length, isProd, p21Connected, porConnected]);

  // Reset currentRowIndex when stopping
  React.useEffect(() => {
    if (!isPlaying) {
      setCurrentRowIndex(null);
    }
  }, [isPlaying]);

  return (
    <div className="container mx-auto p-2">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2 items-center">
          <ServerConnectionDialog
            serverType="P21"
            onConnectionChange={(connected) => {
              setP21Connected(connected);
            }}
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
            onConnectionChange={(connected) => {
              setPorConnected(connected);
            }}
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
            variant="outline"
            size="sm"
            className={`h-7 text-xs ${
              isProd 
                ? 'bg-green-700 hover:bg-green-800 text-white border-green-700' 
                : 'bg-red-700 hover:bg-red-800 text-white border-red-700'
            }`}
            onClick={() => setIsProd(!isProd)}
            disabled={!p21Connected || !porConnected}
          >
            Mode: {isProd ? 'PROD' : 'TEST'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`h-7 text-xs ${
              isPlaying
                ? 'bg-green-700 hover:bg-green-800 text-white border-green-700' 
                : 'bg-red-700 hover:bg-red-800 text-white border-red-700'
            }`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <>
                <PauseIcon className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <PlayIcon className="h-3 w-3 mr-1" />
                Run
              </>
            )}
          </Button>
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
            {chartData.map((row, index) => (
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
