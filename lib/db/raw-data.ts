'use client';

import type {
  RawDashboardData,
  RawHistoricalData,
  RawAccountsPayableData,
  RawCustomersData,
  RawInventoryData,
  RawSiteDistributionData,
  RawProductData,
  RawDataBase
} from '@/lib/types/dashboard';

// Helper function to generate monthly data
function generateMonthlyData(startId: number, prefix: string, baseValue: number, variance: number = 0.2) {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2025, 0, 1);
    date.setMonth(date.getMonth() - i);
    const monthStr = date.toISOString().slice(0, 7);
    const randomFactor = 1 + (Math.random() * 2 - 1) * variance;
    const value = Math.round(baseValue * randomFactor).toString();
    
    return {
      id: startId + i,
      name: `${prefix}_${monthStr}`,
      historicalDate: monthStr,
      value,
      p21: value,
      total: value,
      inventory: value,
      turnover: Math.round(Math.random() * 10).toString()
    };
  });
}

// Metrics Data
const metricsData: RawProductData[] = [
  {
    id: 1,
    name: 'in_process',
    value: '892',
    chartGroup: 'Metrics',
    calculation: 'Count the total number of orders currently in processing status from all active orders in the system',
    sqlExpression: 'SELECT COUNT(*) FROM orders WHERE status = "processing"',
    p21DataDictionary: 'orders'
  },
  {
    id: 2,
    name: 'weekly_revenue',
    value: '1924500',
    chartGroup: 'Metrics',
    calculation: 'Sum all order amounts from the past 7 days, including tax and shipping, excluding cancelled orders',
    sqlExpression: 'SELECT SUM(amount) FROM orders WHERE date >= date("now", "-7 days")',
    p21DataDictionary: 'orders'
  },
  {
    id: 3,
    name: 'open_invoices',
    value: '3842650',
    chartGroup: 'Metrics',
    calculation: 'Calculate total amount of all unpaid invoices that have been issued but not yet marked as paid',
    sqlExpression: 'SELECT SUM(amount) FROM invoices WHERE status = "open"',
    p21DataDictionary: 'invoices'
  },
  {
    id: 4,
    name: 'orders_backlogged',
    value: '743',
    chartGroup: 'Metrics',
    calculation: 'Count orders that are approved but waiting for stock availability or other dependencies before processing',
    sqlExpression: 'SELECT COUNT(*) FROM orders WHERE status = "backlogged"',
    p21DataDictionary: 'orders'
  },
  {
    id: 5,
    name: 'total_sales_monthly',
    value: '8325000',
    chartGroup: 'Metrics',
    calculation: 'Sum the total value of all completed sales transactions in the current calendar month, including discounts and returns',
    sqlExpression: 'SELECT SUM(amount) FROM orders WHERE date >= date("now", "-30 days")',
    p21DataDictionary: 'orders'
  }
];

// Historical Data
const historicalData: RawHistoricalData[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2025, 0, 1);
  date.setMonth(date.getMonth() - i);
  const monthStr = date.toISOString().slice(0, 7);
  const baseValue = 24500000;
  const randomVariation = (Math.random() * 0.2 - 0.1);
  const p21Value = Math.round(baseValue * (1 + randomVariation));
  const porValue = Math.round(baseValue * 0.89 * (1 + randomVariation));

  return {
    id: 100 + i,
    name: `Historical_${monthStr}`,
    chartGroup: 'Historical Data',
    calculation: 'Compare month-over-month revenue trends by summing all completed order amounts for each calendar month',
    sqlExpression: `SELECT * FROM trends WHERE month = "${monthStr}"`,
    p21DataDictionary: 'trends',
    historicalDate: monthStr,
    p21: p21Value.toString(),
    por: porValue.toString()
  };
});

// Accounts Payable Data
const accountsPayableData: RawAccountsPayableData[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2025, 0, 1);
  date.setMonth(date.getMonth() - i);
  const monthStr = date.toISOString().slice(0, 7);
  const basePayable = 3500000;
  const baseOverdue = 850000;
  const randomVariation = (Math.random() * 0.2 - 0.1);
  const totalValue = Math.round(basePayable * (1 + randomVariation));
  const overdueValue = Math.round(baseOverdue * (1 + randomVariation));

  return {
    id: 200 + i,
    name: `AP_${monthStr}`,
    chartGroup: 'Accounts Payable Overview',
    calculation: 'Track monthly accounts payable by summing all outstanding vendor invoices and categorizing by aging periods',
    sqlExpression: `SELECT * FROM accounts_payable WHERE month = "${monthStr}"`,
    p21DataDictionary: 'accounts_payable',
    accountsPayableDate: monthStr,
    total: totalValue.toString(),
    overdue: overdueValue.toString()
  };
});

// Customer Data
const customerData: RawCustomersData[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2025, 0, 1);
  date.setMonth(date.getMonth() - i);
  const monthStr = date.toISOString().slice(0, 7);
  const baseNew = 250;
  const baseProspects = 350;
  const randomVariation = (Math.random() * 0.2 - 0.1);
  const newValue = Math.round(baseNew * (1 + randomVariation));
  const prospectsValue = Math.round(baseProspects * (1 + randomVariation));

  return {
    id: 300 + i,
    name: `Customers_${monthStr}`,
    chartGroup: 'New Customers vs. New Prospects',
    calculation: 'Analyze customer acquisition by counting new customer accounts created each month and comparing to prospect conversions',
    sqlExpression: `SELECT * FROM customers WHERE month = "${monthStr}"`,
    p21DataDictionary: 'customers',
    customersDate: monthStr,
    new: newValue.toString(),
    prospects: prospectsValue.toString()
  };
});

// Inventory Data
const inventoryData: RawInventoryData[] = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2025, 0, 1);
  date.setMonth(date.getMonth() - i);
  const monthStr = date.toISOString().slice(0, 7);
  const baseInventory = 12500000;
  const baseTurnover = 4.2;
  const randomVariation = (Math.random() * 0.2 - 0.1);

  return {
    id: 400 + i,
    name: `Inventory_${monthStr}`,
    chartGroup: 'Inventory Value & Turnover',
    calculation: 'Calculate inventory turnover by dividing total sales by average inventory value for the month',
    sqlExpression: `SELECT * FROM inventory WHERE month = "${monthStr}"`,
    p21DataDictionary: 'inventory',
    inventoryValueDate: monthStr,
    inventory: Math.round(baseInventory * (1 + randomVariation)).toString(),
    turnover: (baseTurnover * (1 + randomVariation)).toFixed(2)
  };
});

// Daily Shipments Data
const dailyShipmentsData: RawProductData[] = Array.from({ length: 7 }, (_, i) => {
  const date = new Date(2025, 0, 11); // Current date
  date.setDate(date.getDate() - i);
  const dateStr = date.toISOString().slice(0, 10);
  
  return {
    id: 500 + i,
    name: dateStr,
    value: Math.round(400 + Math.random() * 200).toString(),
    chartGroup: 'Daily Shipments',
    calculation: 'Track daily shipping performance by counting all orders that reached "shipped" status in the past 24 hours',
    sqlExpression: `SELECT COUNT(*) FROM Shipments WHERE Date = '${dateStr}'`,
    p21DataDictionary: 'Shipments',
    subGroup: 'daily'
  };
});

// Site Distribution Data
const siteDistribution: RawSiteDistributionData[] = [{
  id: 600,
  name: 'site_distribution_current',
  chartGroup: 'Site Distribution',
  calculation: 'Calculate percentage of total orders processed through each site by dividing site orders by total orders',
  sqlExpression: 'SELECT * FROM site_distribution WHERE month = CURRENT_MONTH',
  p21DataDictionary: 'site_distribution',
  historicalDate: new Date().toISOString().slice(0, 7),
  columbus: '1200000',
  addison: '950000',
  lakeCity: '750000'
}];

// Top Products Data
const topProductsData: RawProductData[] = [
  // Inside Sales Products
  {
    id: 801,
    name: 'Copper Fittings',
    value: '450000',
    chartGroup: 'Top Products',
    calculation: 'Identify highest revenue generating product from inside sales channel in the past 30 days by total order value',
    sqlExpression: 'SELECT SUM(value) FROM sales WHERE product = "copper_fittings" AND sales_type = "inside"',
    p21DataDictionary: 'product_sales',
    subGroup: 'inside'
  },
  {
    id: 802,
    name: 'PVC Pipes',
    value: '380000',
    chartGroup: 'Top Products',
    calculation: 'Find product with highest sales volume through inside sales team by counting total units sold this month',
    sqlExpression: 'SELECT SUM(value) FROM sales WHERE product = "pvc_pipes" AND sales_type = "inside"',
    p21DataDictionary: 'product_sales',
    subGroup: 'inside'
  },
  // Outside Sales Products
  {
    id: 803,
    name: 'Steel Pipes',
    value: '520000',
    chartGroup: 'Top Products',
    calculation: 'Determine best performing product by revenue from outside sales representatives in current quarter',
    sqlExpression: 'SELECT SUM(value) FROM sales WHERE product = "steel_pipes" AND sales_type = "outside"',
    p21DataDictionary: 'product_sales',
    subGroup: 'outside'
  },
  {
    id: 804,
    name: 'Valves',
    value: '420000',
    chartGroup: 'Top Products',
    calculation: 'Find product with highest sales volume through outside sales team by counting total units sold this month',
    sqlExpression: 'SELECT SUM(value) FROM sales WHERE product = "valves" AND sales_type = "outside"',
    p21DataDictionary: 'product_sales',
    subGroup: 'outside'
  },
  // Online Sales Products
  {
    id: 805,
    name: 'Tools',
    value: '280000',
    chartGroup: 'Top Products',
    calculation: 'Identify highest revenue generating product from online sales channel in the past 30 days by total order value',
    sqlExpression: 'SELECT SUM(value) FROM sales WHERE product = "tools" AND sales_type = "online"',
    p21DataDictionary: 'product_sales',
    subGroup: 'online'
  },
  {
    id: 806,
    name: 'Accessories',
    value: '180000',
    chartGroup: 'Top Products',
    calculation: 'Find product with highest sales volume through online sales channel by counting total units sold this month',
    sqlExpression: 'SELECT SUM(value) FROM sales WHERE product = "accessories" AND sales_type = "online"',
    p21DataDictionary: 'product_sales',
    subGroup: 'online'
  }
];

// Export raw dashboard data
export const rawDashboardData: RawDashboardData[] = [
  ...metricsData,
  ...historicalData,
  ...accountsPayableData,
  ...customerData,
  ...inventoryData,
  ...dailyShipmentsData,
  ...siteDistribution,
  ...topProductsData
];

// Initialize with initial data
export function initializeRawData(initialData: RawDashboardData[]) {
  rawDashboardData.length = 0;
  rawDashboardData.push(...initialData);
}

// Import and initialize with initial data
import { initialData } from './initial-data';
initializeRawData([
  ...metricsData,
  ...historicalData,
  ...accountsPayableData,
  ...customerData,
  ...inventoryData,
  ...siteDistribution,
  ...dailyShipmentsData,
  ...topProductsData
]);
