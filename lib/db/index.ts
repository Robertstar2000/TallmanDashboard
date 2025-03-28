'use client';

import { executeRead, executeWrite, getDb } from './sqlite';
import {
  Metric,
  DailyShipment,
  SiteDistribution,
  RawAccountsPayableData,
  MonthlyData,
  Product,
  HistoricalDataPoint,
  CustomerMetric,
  WebMetric,
  RawARAgingData,
  ServerHealthCheckResult,
  ServerHealthStatusEnum
} from '../types/dashboard';

// Initialize tables if they don't exist
async function setupTables() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS metrics (
      name TEXT PRIMARY KEY,
      value REAL
    )`,
    `CREATE TABLE IF NOT EXISTS daily_orders (
      day TEXT PRIMARY KEY,
      orders INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS site_distribution (
      name TEXT PRIMARY KEY,
      columbus REAL,
      addison REAL,
      lakeCity REAL
    )`,
    `CREATE TABLE IF NOT EXISTS customer_metrics (
      month TEXT PRIMARY KEY,
      newCustomers INTEGER,
      prospects INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS accounts (
      month TEXT PRIMARY KEY,
      payable REAL,
      overdue REAL,
      receivable REAL
    )`,
    `CREATE TABLE IF NOT EXISTS por (
      month TEXT PRIMARY KEY,
      newRentals INTEGER,
      openRentals INTEGER,
      rentalValue REAL
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      category TEXT PRIMARY KEY,
      inStock INTEGER,
      onOrder INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS historical_data (
      month TEXT PRIMARY KEY,
      p21 REAL,
      por REAL,
      total REAL
    )`,
    `CREATE TABLE IF NOT EXISTS web_metrics (
      month TEXT PRIMARY KEY,
      W_Orders INTEGER,
      W_Revenue REAL
    )`,
    `CREATE TABLE IF NOT EXISTS ar_aging (
      id TEXT PRIMARY KEY,
      chartGroup TEXT,
      calculation TEXT,
      name TEXT,
      value TEXT,
      arAgingDate TEXT,
      sqlExpression TEXT,
      p21DataDictionary TEXT,
      current TEXT,
      aging_1_30 TEXT,
      aging_31_60 TEXT,
      aging_61_90 TEXT,
      aging_90_plus TEXT
    )`
  ];

  for (const sql of tables) {
    executeWrite(sql);
  }
}

// Data retrieval functions
async function getMetrics(): Promise<Metric[]> {
  return executeRead('SELECT * FROM metrics');
}

async function getDailyOrders(): Promise<DailyShipment[]> {
  return executeRead('SELECT * FROM daily_orders');
}

async function getSiteDistribution(): Promise<SiteDistribution[]> {
  return executeRead('SELECT * FROM site_distribution');
}

async function getCustomerMetrics(): Promise<CustomerMetric[]> {
  return executeRead('SELECT * FROM customer_metrics');
}

async function getAccounts(): Promise<RawAccountsPayableData[]> {
  return executeRead('SELECT * FROM accounts');
}

async function getPOR(): Promise<MonthlyData[]> {
  return executeRead('SELECT * FROM por');
}

async function getInventoryValue(): Promise<Product[]> {
  return executeRead('SELECT * FROM inventory');
}

async function getHistoricalData(): Promise<HistoricalDataPoint[]> {
  return executeRead('SELECT * FROM historical_data');
}

async function getWebMetrics(): Promise<WebMetric[]> {
  return executeRead('SELECT * FROM web_metrics');
}

async function getARAgingData(): Promise<RawARAgingData[]> {
  return executeRead('SELECT * FROM ar_aging');
}

// Data update functions
async function updateMetric(name: string, value: number): Promise<void> {
  executeWrite(`
    INSERT OR REPLACE INTO metrics (name, value)
    VALUES ('${name}', ${value})
  `);
}

async function updateDailyOrders(date: string, orders: number): Promise<void> {
  executeWrite(`
    INSERT OR REPLACE INTO daily_orders (date, orders)
    VALUES ('${date}', ${orders})
  `);
}

async function resetData(): Promise<void> {
  const tables = [
    'metrics',
    'daily_orders',
    'site_distribution',
    'customer_metrics',
    'accounts',
    'por',
    'inventory',
    'historical_data',
    'web_metrics',
    'ar_aging'
  ];
  
  for (const table of tables) {
    await executeWrite(`DELETE FROM ${table}`);
  }
}

// Server health check
async function checkServerHealth(): Promise<ServerHealthCheckResult> {
  try {
    // Test database connection
    executeRead('SELECT 1');
    
    return {
      status: ServerHealthStatusEnum.Connected,
      message: 'Server is running and connected',
    };
  } catch (error) {
    console.error('Server health check failed:', error);
    return {
      status: ServerHealthStatusEnum.Error,
      message: 'Server connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Initialize tables when the module is loaded
setupTables();

// Export all functions in a single statement
export {
  getMetrics,
  getDailyOrders,
  getSiteDistribution,
  getCustomerMetrics,
  getAccounts,
  getPOR,
  getInventoryValue,
  getHistoricalData,
  getWebMetrics,
  getARAgingData,
  updateMetric,
  updateDailyOrders,
  resetData,
  checkServerHealth
};