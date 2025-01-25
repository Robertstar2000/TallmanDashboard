'use client';

import { 
  RawHistoricalData,
  RawProductData,
  RawAccountsPayableData,
  RawCustomersData,
  RawInventoryData,
  RawSiteDistributionData,
  RawDashboardData,
  SpreadsheetData
} from '@/lib/types/dashboard';

function generateLastNMonths(n: number, baseDate: string = '2025-01-11'): string[] {
  const dates: string[] = [];
  const date = new Date(baseDate);
  
  for (let i = 0; i < n; i++) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    dates.push(`${year}-${month.toString().padStart(2, '0')}-01`);
    date.setMonth(date.getMonth() - 1);
  }
  
  return dates;
}

function generateLastNDays(n: number, baseDate: string = '2025-01-11'): string[] {
  const dates: string[] = [];
  const date = new Date(baseDate);
  
  for (let i = 0; i < n; i++) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    date.setDate(date.getDate() - 1);
  }
  
  return dates;
}

export const testDashboardData: RawDashboardData[] = [
  // Metrics - 6 unique metrics
  {
    id: 1,
    name: 'Total Orders',
    chartGroup: 'Metrics',
    calculation: 'COUNT',
    sqlExpression: 'SELECT COUNT(DISTINCT order_no) FROM pub.oe_hdr WHERE company_id = 1 AND order_date >= DATEADD(day, -1, GETDATE())',
    p21DataDictionary: 'orders',
    value: '150'
  },
  {
    id: 2,
    name: 'Average Order Value',
    chartGroup: 'Metrics',
    calculation: 'AVG',
    sqlExpression: 'SELECT AVG(order_value) FROM pub.oe_hdr WHERE company_id = 1 AND order_date >= DATEADD(day, -1, GETDATE())',
    p21DataDictionary: 'orders',
    value: '2500'
  },
  {
    id: 3,
    name: 'Active Customers',
    chartGroup: 'Metrics',
    calculation: 'COUNT',
    sqlExpression: 'SELECT COUNT(DISTINCT customer_id) FROM pub.customers WHERE status = "active"',
    p21DataDictionary: 'customers',
    value: '450'
  },
  {
    id: 4,
    name: 'Open Support Tickets',
    chartGroup: 'Metrics',
    calculation: 'COUNT',
    sqlExpression: 'SELECT COUNT(*) FROM pub.support_tickets WHERE status = "open"',
    p21DataDictionary: 'support',
    value: '25'
  },
  {
    id: 5,
    name: 'Revenue MTD',
    chartGroup: 'Metrics',
    calculation: 'SUM',
    sqlExpression: 'SELECT SUM(revenue) FROM pub.transactions WHERE date >= DATE_TRUNC("month", CURRENT_DATE)',
    p21DataDictionary: 'finance',
    value: '1250000'
  },
  {
    id: 6,
    name: 'Website Visitors',
    chartGroup: 'Metrics',
    calculation: 'COUNT',
    sqlExpression: 'SELECT COUNT(DISTINCT visitor_id) FROM pub.website_analytics WHERE visit_date = CURRENT_DATE',
    p21DataDictionary: 'analytics',
    value: '3200'
  },

  // Historical Data - 12 months
  ...generateLastNMonths(12).map((date, index) => ({
    id: 100 + index,
    name: new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' }),
    chartGroup: 'Historical Data',
    calculation: 'Monthly',
    sqlExpression: 'SELECT * FROM historical_data WHERE date = @date',
    p21DataDictionary: 'historical',
    historicalDate: date,
    p21: (1000000 + Math.floor(Math.random() * 500000)).toString(),
    por: (800000 + Math.floor(Math.random() * 400000)).toString()
  })),

  // Inventory Value & Turnover - 12 months
  ...generateLastNMonths(12).map((date, index) => ({
    id: 150 + index,
    name: new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' }),
    chartGroup: 'Inventory Value & Turnover',
    calculation: 'Monthly',
    sqlExpression: 'SELECT * FROM inventory WHERE date = @date',
    p21DataDictionary: 'inventory',
    inventoryValueDate: date,
    inventory: (5000000 + Math.floor(Math.random() * 1000000)).toString(), // Inventory value
    turnover: ((2 + Math.random() * 1).toFixed(2)).toString() // Turnover ratio between 2-3
  })),

  // Accounts Payable Overview - 12 months
  ...generateLastNMonths(12).map((date, index) => ({
    id: 200 + index,
    name: new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' }),
    chartGroup: 'Accounts Payable Overview',
    calculation: 'Monthly',
    sqlExpression: 'SELECT * FROM accounts_payable WHERE date = @date',
    p21DataDictionary: 'payables',
    accountsPayableDate: date,
    total: (500000 + Math.floor(Math.random() * 200000)).toString(),
    overdue: (100000 + Math.floor(Math.random() * 50000)).toString()
  })),

  // New Customers vs. New Prospects - 12 months
  ...generateLastNMonths(12).map((date, index) => ({
    id: 300 + index,
    name: new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' }),
    chartGroup: 'New Customers vs. New Prospects',
    calculation: 'Monthly',
    sqlExpression: 'SELECT * FROM customers WHERE date = @date',
    p21DataDictionary: 'customers',
    customersDate: date,
    new: (20 + Math.floor(Math.random() * 10)).toString(),
    prospects: (30 + Math.floor(Math.random() * 15)).toString()
  })),

  // Daily Shipments - 7 days
  ...generateLastNDays(7).map((date, index) => ({
    id: 400 + index,
    name: new Date(date).toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' }),
    chartGroup: 'Daily Shipments',
    calculation: 'Daily',
    sqlExpression: 'SELECT * FROM daily_shipments WHERE date = @date',
    p21DataDictionary: 'shipments',
    updateTime: date,
    value: (200 + Math.floor(Math.random() * 50)).toString()
  })),

  // Site Distribution - three separate lines
  {
    id: 500,
    name: 'Columbus',
    chartGroup: 'Site Distribution',
    calculation: 'Distribution',
    sqlExpression: 'SELECT * FROM site_distribution WHERE site = "columbus"',
    p21DataDictionary: 'sites',
    value: '2500000'
  },
  {
    id: 501,
    name: 'Addison',
    chartGroup: 'Site Distribution',
    calculation: 'Distribution',
    sqlExpression: 'SELECT * FROM site_distribution WHERE site = "addison"',
    p21DataDictionary: 'sites',
    value: '1800000'
  },
  {
    id: 502,
    name: 'Lake City',
    chartGroup: 'Site Distribution',
    calculation: 'Distribution',
    sqlExpression: 'SELECT * FROM site_distribution WHERE site = "lake_city"',
    p21DataDictionary: 'sites',
    value: '1200000'
  },

  // Top Products - 6 items
  {
    id: 600,
    name: 'Copper Fittings',
    chartGroup: 'Top Products',
    subGroup: 'Inside Sales',
    calculation: 'SUM',
    sqlExpression: 'SELECT * FROM product_sales WHERE product = "copper_fittings"',
    p21DataDictionary: 'products',
    value: '450000'
  },
  {
    id: 601,
    name: 'PVC Pipes',
    chartGroup: 'Top Products',
    subGroup: 'Inside Sales',
    calculation: 'SUM',
    sqlExpression: 'SELECT * FROM product_sales WHERE product = "pvc_pipes"',
    p21DataDictionary: 'products',
    value: '380000'
  },
  {
    id: 602,
    name: 'Steel Pipes',
    chartGroup: 'Top Products',
    subGroup: 'Outside Sales',
    calculation: 'SUM',
    sqlExpression: 'SELECT * FROM product_sales WHERE product = "steel_pipes"',
    p21DataDictionary: 'products',
    value: '520000'
  },
  {
    id: 603,
    name: 'Valves',
    chartGroup: 'Top Products',
    subGroup: 'Outside Sales',
    calculation: 'SUM',
    sqlExpression: 'SELECT * FROM product_sales WHERE product = "valves"',
    p21DataDictionary: 'products',
    value: '420000'
  },
  {
    id: 604,
    name: 'Tools',
    chartGroup: 'Top Products',
    subGroup: 'Online Sales',
    calculation: 'SUM',
    sqlExpression: 'SELECT * FROM product_sales WHERE product = "tools"',
    p21DataDictionary: 'products',
    value: '280000'
  },
  {
    id: 605,
    name: 'Accessories',
    chartGroup: 'Top Products',
    subGroup: 'Online Sales',
    calculation: 'SUM',
    sqlExpression: 'SELECT * FROM product_sales WHERE product = "accessories"',
    p21DataDictionary: 'products',
    value: '180000'
  }
];
