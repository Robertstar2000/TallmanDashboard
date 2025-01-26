import { createClient } from '@libsql/client';
import { ARAgingData } from '@/lib/types/dashboard';

// For browser environment, we'll use localStorage to simulate the database
const storage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error('Error saving to localStorage');
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch {
      console.error('Error clearing localStorage');
    }
  }
};

// Initial data for a $100M business
const initialData = {
  metrics: [
    { name: 'total_orders', value: 12847 },
    { name: 'open_orders', value: 1563 },
    { name: 'open_orders_2', value: 892 },
    { name: 'daily_revenue', value: 1924500 },
    { name: 'open_invoices', value: 3842650 },
    { name: 'orders_backlogged', value: 743 },
    { name: 'total_sales_monthly', value: 8325000 }
  ],
  historicalData: [
    { month: 'Jan', p21: 2500000, por: 1800000, total: 4300000 },
    { month: 'Feb', p21: 2700000, por: 1900000, total: 4600000 },
    { month: 'Mar', p21: 2800000, por: 2100000, total: 4900000 },
    { month: 'Apr', p21: 2600000, por: 2000000, total: 4600000 },
    { month: 'May', p21: 2900000, por: 2200000, total: 5100000 },
    { month: 'Jun', p21: 3100000, por: 2300000, total: 5400000 },
    { month: 'Jul', p21: 3000000, por: 2400000, total: 5400000 },
    { month: 'Aug', p21: 3200000, por: 2500000, total: 5700000 },
    { month: 'Sep', p21: 3300000, por: 2600000, total: 5900000 },
    { month: 'Oct', p21: 3400000, por: 2700000, total: 6100000 },
    { month: 'Nov', p21: 3500000, por: 2800000, total: 6300000 },
    { month: 'Dec', p21: 3600000, por: 2900000, total: 6500000 },
    { month: 'Jan', p21: 3700000, por: 3000000, total: 6700000 },
    { month: 'Feb', p21: 3800000, por: 3100000, total: 6900000 },
    { month: 'Mar', p21: 3900000, por: 3200000, total: 7100000 },
    { month: 'Apr', p21: 4000000, por: 3300000, total: 7300000 },
    { month: 'May', p21: 4100000, por: 3400000, total: 7500000 },
    { month: 'Jun', p21: 4200000, por: 3500000, total: 7700000 },
    { month: 'Jul', p21: 4300000, por: 3600000, total: 7900000 },
    { month: 'Aug', p21: 4400000, por: 3700000, total: 8100000 },
    { month: 'Sep', p21: 4500000, por: 3800000, total: 8300000 },
    { month: 'Oct', p21: 4600000, por: 3900000, total: 8500000 },
    { month: 'Nov', p21: 4700000, por: 4000000, total: 8700000 },
    { month: 'Dec', p21: 4800000, por: 4100000, total: 8900000 }
  ],
  dailyOrders: [
    { day: 'Mon', orders: 145 },
    { day: 'Tue', orders: 132 },
    { day: 'Wed', orders: 164 },
    { day: 'Thu', orders: 156 },
    { day: 'Fri', orders: 178 },
    { day: 'Sat', orders: 95 },
    { day: 'Sun', orders: 84 }
  ],
  siteDistribution: [
    { name: 'Columbus', value: 4850000 },
    { name: 'Addison', value: 2100000 },
    { name: 'Lake City', value: 1375000 }
  ],
  inventoryValue: [
    { category: '100', inStock: 45, onOrder: 10 },
    { category: '101', inStock: 62, onOrder: 15 },
    { category: '102', inStock: 78, onOrder: 20 },
    { category: '107', inStock: 53, onOrder: 12 }
  ],
  growthMetrics: [
    { month: 'Jan', newCustomers: 45, newProducts: 32 },
    { month: 'Feb', newCustomers: 52, newProducts: 28 },
    { month: 'Mar', newCustomers: 48, newProducts: 35 },
    { month: 'Apr', newCustomers: 55, newProducts: 42 },
    { month: 'May', newCustomers: 58, newProducts: 38 },
    { month: 'Jun', newCustomers: 62, newProducts: 45 }
  ],
  accounts: [
    { month: 'Jan', payable: 2850000, overdue: 425000, receivable: 3250000 },
    { month: 'Feb', payable: 3100000, overdue: 385000, receivable: 3450000 },
    { month: 'Mar', payable: 2950000, overdue: 445000, receivable: 3150000 },
    { month: 'Apr', payable: 3250000, overdue: 395000, receivable: 3650000 },
    { month: 'May', payable: 3400000, overdue: 365000, receivable: 3850000 },
    { month: 'Jun', payable: 3150000, overdue: 405000, receivable: 3550000 },
    { month: 'Jul', payable: 3300000, overdue: 415000, receivable: 3750000 },
    { month: 'Aug', payable: 3450000, overdue: 375000, receivable: 3950000 },
    { month: 'Sep', payable: 3600000, overdue: 355000, receivable: 4150000 },
    { month: 'Oct', payable: 3750000, overdue: 335000, receivable: 4350000 },
    { month: 'Nov', payable: 3900000, overdue: 315000, receivable: 4550000 },
    { month: 'Dec', payable: 4050000, overdue: 295000, receivable: 4750000 }
  ],
  por: [
    { month: 'Jan', newRentals: 45, openRentals: 120, rentalValue: 65000 },
    { month: 'Feb', newRentals: 52, openRentals: 135, rentalValue: 72000 },
    { month: 'Mar', newRentals: 48, openRentals: 142, rentalValue: 68000 },
    { month: 'Apr', newRentals: 55, openRentals: 150, rentalValue: 78000 },
    { month: 'May', newRentals: 62, openRentals: 158, rentalValue: 85000 },
    { month: 'Jun', newRentals: 58, openRentals: 165, rentalValue: 82000 },
    { month: 'Jul', newRentals: 64, openRentals: 172, rentalValue: 88000 },
    { month: 'Aug', newRentals: 68, openRentals: 180, rentalValue: 92000 },
    { month: 'Sep', newRentals: 72, openRentals: 188, rentalValue: 96000 },
    { month: 'Oct', newRentals: 76, openRentals: 195, rentalValue: 100000 },
    { month: 'Nov', newRentals: 80, openRentals: 202, rentalValue: 104000 },
    { month: 'Dec', newRentals: 84, openRentals: 210, rentalValue: 108000 }
  ],
  webMetrics: [
    { month: 'Jan', W_Orders: 245, W_Revenue: 125000 },
    { month: 'Feb', W_Orders: 362, W_Revenue: 148000 },
    { month: 'Mar', W_Orders: 456, W_Revenue: 195000 },
    { month: 'Apr', W_Orders: 478, W_Revenue: 242000 },
    { month: 'May', W_Orders: 524, W_Revenue: 268000 },
    { month: 'Jun', W_Orders: 568, W_Revenue: 285000 },
    { month: 'Jul', W_Orders: 612, W_Revenue: 312000 },
    { month: 'Aug', W_Orders: 645, W_Revenue: 328000 },
    { month: 'Sep', W_Orders: 678, W_Revenue: 345000 },
    { month: 'Oct', W_Orders: 712, W_Revenue: 362000 },
    { month: 'Nov', W_Orders: 745, W_Revenue: 378000 },
    { month: 'Dec', W_Orders: 785, W_Revenue: 398000 }
  ],
  customerMetrics: [
    { month: 'Jan', newCustomers: 45, prospects: 120 },
    { month: 'Feb', newCustomers: 52, prospects: 135 },
    { month: 'Mar', newCustomers: 48, prospects: 142 },
    { month: 'Apr', newCustomers: 55, prospects: 150 },
    { month: 'May', newCustomers: 62, prospects: 158 },
    { month: 'Jun', newCustomers: 58, prospects: 165 },
    { month: 'Jul', newCustomers: 64, prospects: 172 },
    { month: 'Aug', newCustomers: 68, prospects: 180 },
    { month: 'Sep', newCustomers: 72, prospects: 188 },
    { month: 'Oct', newCustomers: 75, prospects: 195 },
    { month: 'Nov', newCustomers: 78, prospects: 202 },
    { month: 'Dec', newCustomers: 82, prospects: 210 }
  ]
};

if (typeof window !== 'undefined') {
  // Initialize data if not present
  if (!storage.getItem('metrics')) {
    storage.setItem('metrics', JSON.stringify(initialData.metrics));
  }
  if (!storage.getItem('historicalData')) {
    storage.setItem('historicalData', JSON.stringify(initialData.historicalData));
  }
  if (!storage.getItem('dailyOrders')) {
    storage.setItem('dailyOrders', JSON.stringify(initialData.dailyOrders));
  }
  if (!storage.getItem('siteDistribution')) {
    storage.setItem('siteDistribution', JSON.stringify(initialData.siteDistribution));
  }
  if (!storage.getItem('inventoryValue')) {
    storage.setItem('inventoryValue', JSON.stringify(initialData.inventoryValue));
  }
  if (!storage.getItem('growthMetrics')) {
    storage.setItem('growthMetrics', JSON.stringify(initialData.growthMetrics));
  }
  if (!storage.getItem('accounts')) {
    storage.setItem('accounts', JSON.stringify(initialData.accounts));
  }
  if (!storage.getItem('por')) {
    storage.setItem('por', JSON.stringify(initialData.por));
  }
  if (!storage.getItem('customerMetrics')) {
    storage.setItem('customerMetrics', JSON.stringify(initialData.customerMetrics));
  }
  if (!storage.getItem('webMetrics')) {
    storage.setItem('webMetrics', JSON.stringify(initialData.webMetrics));
  }
}

interface ConnectionConfig {
  serverName: string;
  ipAddress: string;
  port: string;
  database: string;
  username: string;
  password: string;
  instance?: string;
  domain: string;
}

// SQL Server connection configurations
let p21Connection: ConnectionConfig | null = null;
let porConnection: ConnectionConfig | null = null;

export const connectToServer = (serverType: 'P21' | 'POR', config: ConnectionConfig | null) => {
  // If config is null, disconnect
  if (!config) {
    if (serverType === 'P21') {
      p21Connection = null;
    } else {
      porConnection = null;
    }
    console.log(`
      ========== SERVER DISCONNECTION ==========
      Type: ${serverType}
      Status: Disconnected
      =======================================
    `);
    return true;
  }

  // Store connection details
  if (serverType === 'P21') {
    p21Connection = config;
  } else {
    porConnection = config;
  }

  // Build connection string
  let connectionString;
  if (serverType === 'P21') {
    connectionString = buildConnectionString(config);
  } else {
    connectionString = buildPORConnectionString(config);
  }
  console.log(`
    ========== SERVER CONNECTION ==========
    Type: ${serverType}
    Server: ${config.serverName}
    Database: ${config.database}
    Connection String: ${connectionString}
    =====================================
  `);

  return true;
};

const buildConnectionString = (config: ConnectionConfig): string => {
  // Build SQL Server connection string with P21 compatibility settings
  let server = config.ipAddress;
  if (config.instance) {
    server += '\\' + config.instance;
  }
  if (config.port) {
    server += ',' + config.port;
  }

  return `Server=${server};Database=${config.database};Domain=${config.domain};User Id=${config.username};Password=${config.password};Trusted_Connection=False;TrustServerCertificate=True;ApplicationIntent=ReadWrite;MultiSubnetFailover=False;Encrypt=True;ConnectRetryCount=3;ConnectRetryInterval=10;`;
};

const buildPORConnectionString = (config: ConnectionConfig): string => {
  // Build Point of Rental SQL Server connection string with standard settings
  let server = config.ipAddress;
  if (config.instance) {
    server += '\\' + config.instance;
  }
  if (config.port) {
    server += ',' + config.port;
  }

  return `Server=${server};Database=${config.database};Domain=${config.domain};User Id=${config.username};Password=${config.password};Trusted_Connection=False;TrustServerCertificate=True;ApplicationIntent=ReadWrite;MultipleActiveResultSets=True;Encrypt=True;ConnectRetryCount=3;ConnectRetryInterval=10;`;
};

export const isServerConnected = (serverType: 'P21' | 'POR') => {
  return serverType === 'P21' ? p21Connection !== null : porConnection !== null;
};

export const executeQuery = async (serverType: 'P21' | 'POR', tableName: string, sqlExpression: string): Promise<number> => {
  try {
    // Get the appropriate connection
    const connection = serverType === 'P21' ? p21Connection : porConnection;
    if (!connection) {
      console.error(`No ${serverType} connection available`);
      return 0;
    }

    // Log the query for debugging
    console.log(`
      ========== EXECUTING QUERY ==========
      Server: ${serverType}
      Table: ${tableName}
      Query: ${sqlExpression}
      ===================================
    `);

    // In development, we're using localStorage
    if (typeof window !== 'undefined') {
      return 1; // Simulate successful query
    }

    // TODO: Implement actual SQL query execution
    // For now, return 1 to simulate success
    return 1;
  } catch (error) {
    console.error(`Error executing query on ${serverType}:`, error);
    throw error;
  }
};

export const executePORQuery = async (tableName: string, sqlExpression: string): Promise<number> => {
  try {
    const connection = porConnection;
    if (!connection) {
      console.error('No POR connection available');
      return 0;
    }

    // Log the query for debugging
    console.log(`
      ========== EXECUTING POR QUERY ==========
      Table: ${tableName}
      Query: ${sqlExpression}
      =====================================
    `);

    // In development, we're using localStorage
    if (typeof window !== 'undefined') {
      return 1; // Simulate successful query
    }

    // TODO: Implement actual SQL query execution
    // For now, return 1 to simulate success
    return 1;
  } catch (error) {
    console.error('Error executing POR query:', error);
    throw error;
  }
};

export const getMetrics = () => {
  const data = storage.getItem('metrics');
  if (!data) {
    storage.setItem('metrics', JSON.stringify(initialData.metrics));
    return initialData.metrics;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.metrics;
  } catch {
    return initialData.metrics;
  }
};

export const updateMetric = (name: string, value: number) => {
  const metrics = getMetrics();
  const updatedMetrics = metrics.map((m: any) =>
    m.name === name ? { ...m, value } : m
  );
  storage.setItem('metrics', JSON.stringify(updatedMetrics));
  return updatedMetrics;
};

export const getHistoricalData = () => {
  const data = storage.getItem('historicalData');
  if (!data) {
    storage.setItem('historicalData', JSON.stringify(initialData.historicalData));
    return initialData.historicalData;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.historicalData;
  } catch {
    return initialData.historicalData;
  }
};

export const updateHistoricalData = (month: string, p21: number, por: number, total: number) => {
  const data = getHistoricalData();
  const index = data.findIndex((d: any) => d.month === month);
  if (index >= 0) {
    data[index] = { month, p21, por, total };
  } else {
    data.push({ month, p21, por, total });
  }
  storage.setItem('historicalData', JSON.stringify(data));
  return data;
};

export const getDailyOrders = () => {
  const data = storage.getItem('dailyOrders');
  if (!data) {
    storage.setItem('dailyOrders', JSON.stringify(initialData.dailyOrders));
    return initialData.dailyOrders;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.dailyOrders;
  } catch {
    return initialData.dailyOrders;
  }
};

export const updateDailyOrders = (day: string, orders: number) => {
  const data = getDailyOrders();
  const index = data.findIndex((d: any) => d.day === day);
  if (index >= 0) {
    data[index] = { day, orders };
  } else {
    data.push({ day, orders });
  }
  storage.setItem('dailyOrders', JSON.stringify(data));
  return data;
};

export const getSiteDistribution = () => {
  const data = storage.getItem('siteDistribution');
  if (!data) {
    storage.setItem('siteDistribution', JSON.stringify(initialData.siteDistribution));
    return initialData.siteDistribution;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.siteDistribution;
  } catch {
    return initialData.siteDistribution;
  }
};

export const updateSiteDistribution = (name: string, value: number) => {
  const data = getSiteDistribution();
  const index = data.findIndex((d: any) => d.name === name);
  if (index >= 0) {
    data[index] = { name, value };
  } else {
    data.push({ name, value });
  }
  storage.setItem('siteDistribution', JSON.stringify(data));
  return data;
};

export const getAccounts = () => {
  const data = storage.getItem('accounts');
  if (!data) {
    storage.setItem('accounts', JSON.stringify(initialData.accounts));
    return initialData.accounts;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.accounts;
  } catch {
    return initialData.accounts;
  }
};

export const updateAccounts = (month: string, payable: number, overdue: number, receivable: number) => {
  const accounts = getAccounts();
  const updatedAccounts = accounts.map((item: any) => 
    item.month === month 
      ? { ...item, payable, overdue, receivable }
      : item
  );
  storage.setItem('accounts', JSON.stringify(updatedAccounts));
  return updatedAccounts;
};

export const getPOR = () => {
  const data = storage.getItem('por');
  if (!data) {
    storage.setItem('por', JSON.stringify(initialData.por));
    return initialData.por;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.por;
  } catch {
    return initialData.por;
  }
};

export const updatePOR = (month: string, newRentals: number, openRentals: number, rentalValue: number) => {
  const data = getPOR();
  const index = data.findIndex((d: any) => d.month === month);
  if (index >= 0) {
    data[index] = { month, newRentals, openRentals, rentalValue };
  } else {
    data.push({ month, newRentals, openRentals, rentalValue });
  }
  storage.setItem('por', JSON.stringify(data));
  return data;
};

export const getInventoryValue = () => {
  const data = storage.getItem('inventoryValue');
  // If no data exists, initialize with default data
  if (!data) {
    storage.setItem('inventoryValue', JSON.stringify(initialData.inventoryValue));
    return initialData.inventoryValue;
  }
  try {
    // Parse the data and ensure it's an array, otherwise return default data
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.inventoryValue;
  } catch {
    // If any error occurs, return default data
    return initialData.inventoryValue;
  }
};

export const updateInventoryValue = (category: string, inStock: number, onOrder: number) => {
  const data = getInventoryValue();
  const index = data.findIndex((d: any) => d.category === category);
  if (index >= 0) {
    data[index] = { category, inStock, onOrder };
  } else {
    data.push({ category, inStock, onOrder });
  }
  storage.setItem('inventoryValue', JSON.stringify(data));
  return data;
};

export const getGrowthMetrics = () => {
  const data = storage.getItem('growthMetrics');
  if (!data) {
    storage.setItem('growthMetrics', JSON.stringify(initialData.growthMetrics));
    return initialData.growthMetrics;
  }
  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsedData) ? parsedData : initialData.growthMetrics;
  } catch {
    return initialData.growthMetrics;
  }
};

export const updateGrowthMetrics = (month: string, newCustomers: number, newProducts: number) => {
  const data = getGrowthMetrics();
  const index = data.findIndex((d: any) => d.month === month);
  if (index >= 0) {
    data[index] = { month, newCustomers, newProducts };
  } else {
    data.push({ month, newCustomers, newProducts });
  }
  storage.setItem('growthMetrics', JSON.stringify(data));
  return data;
};

export const getWebMetrics = () => {
  if (typeof window === 'undefined') return [];
  try {
    const data = storage.getItem('webMetrics');
    if (!data) {
      console.log('No web metrics data found, using initial data');
      return initialData.webMetrics;
    }
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      console.log('Invalid web metrics data format, using initial data');
      return initialData.webMetrics;
    }
    return parsedData;
  } catch (error) {
    console.error('Error getting web metrics:', error);
    return initialData.webMetrics;
  }
};

export const getCustomerMetrics = () => {
  if (typeof window === 'undefined') return [];
  try {
    const data = storage.getItem('customerMetrics');
    if (!data) {
      console.log('No customer metrics data found, using initial data');
      return initialData.customerMetrics;
    }
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      console.log('Invalid customer metrics data format, using initial data');
      return initialData.customerMetrics;
    }
    return parsedData;
  } catch (error) {
    console.error('Error getting customer metrics:', error);
    return initialData.customerMetrics;
  }
};

export const getARAgingData = (): ARAgingData[] => {
  if (typeof window === 'undefined') return [];
  const rawData = storage.getItem('arAging');
  if (!rawData) return [];
  const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
  if (!Array.isArray(data)) return [];
  return data.map((item: { name: string; value?: number; current?: number; arAgingDate: string }) => ({
    name: item.name,
    value: Number(item.value || item.current || 0),
    date: item.arAgingDate
  }));
};

export const resetData = () => {
  if (typeof window === 'undefined') return;
  
  // Clear all existing data
  storage.clear();
  
  // Initialize with fresh data
  storage.setItem('metrics', JSON.stringify(initialData.metrics));
  storage.setItem('historicalData', JSON.stringify(initialData.historicalData));
  storage.setItem('dailyOrders', JSON.stringify(initialData.dailyOrders));
  storage.setItem('siteDistribution', JSON.stringify(initialData.siteDistribution));
  storage.setItem('accounts', JSON.stringify(initialData.accounts));
  storage.setItem('por', JSON.stringify(initialData.por));
  storage.setItem('inventoryValue', JSON.stringify(initialData.inventoryValue));
  storage.setItem('growthMetrics', JSON.stringify(initialData.growthMetrics));
  storage.setItem('webMetrics', JSON.stringify(initialData.webMetrics));
  storage.setItem('customerMetrics', JSON.stringify(initialData.customerMetrics));
  
  return {
    metrics: initialData.metrics,
    historicalData: initialData.historicalData,
    dailyOrders: initialData.dailyOrders,
    siteDistribution: initialData.siteDistribution,
    accounts: initialData.accounts,
    por: initialData.por,
    inventoryValue: initialData.inventoryValue,
    growthMetrics: initialData.growthMetrics,
    webMetrics: initialData.webMetrics,
    customerMetrics: initialData.customerMetrics
  };
};