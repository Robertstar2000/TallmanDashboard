'use client';

import { createClient } from '@libsql/client';
import { P21_SCHEMA } from './p21-schema';
import { P21_DATA_DICTIONARY } from './data-dictionary';
import { rawDashboardData } from './raw-data';
import { RawDashboardData, RawHistoricalData, RawSiteDistributionData, RawAccountsPayableData, RawCustomersData, RawInventoryData, RawARAgingData } from '@/lib/types/dashboard';

const db = createClient({
  url: 'file:dashboard?mode=memory&cache=shared'
});

// Type guards for specific data types
function hasHistoricalDate(data: RawDashboardData): data is RawHistoricalData | RawSiteDistributionData {
  return 'historicalDate' in data;
}

function hasAccountsPayableDate(data: RawDashboardData): data is RawAccountsPayableData {
  return 'accountsPayableDate' in data;
}

function hasCustomersDate(data: RawDashboardData): data is RawCustomersData {
  return 'customersDate' in data;
}

function hasInventoryDate(data: RawDashboardData): data is RawInventoryData {
  return 'inventoryValueDate' in data;
}

function hasArAgingDate(data: RawDashboardData): data is RawARAgingData {
  return 'arAgingDate' in data;
}

async function initializeDatabase() {
  try {
    // Create tables based on P21 schema
    for (const [key, schema] of Object.entries(P21_SCHEMA)) {
      const fields = Object.values(schema.fields)
        .map(fieldName => {
          const fieldInfo = P21_DATA_DICTIONARY[fieldName];
          if (!fieldInfo) return `${fieldName} TEXT`;
          return `${fieldName} ${fieldInfo.type}`;
        })
        .join(',\n          ');

      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${schema.table} (
          ${fields}
        )
      `);
    }

    // Create dashboard variables table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS dashboard_variables (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        chartGroup TEXT,
        calculation TEXT,
        sqlExpression TEXT,
        p21DataDictionary TEXT,
        historicalDate TEXT,
        p21 TEXT,
        por TEXT,
        accountsPayableDate TEXT,
        total TEXT,
        overdue TEXT,
        customersDate TEXT,
        new TEXT,
        prospects TEXT,
        inventoryValueDate TEXT,
        inventory TEXT,
        turnover TEXT,
        arAgingDate TEXT,
        current TEXT,
        aging_1_30 TEXT,
        aging_31_60 TEXT,
        aging_61_90 TEXT,
        aging_90_plus TEXT,
        value TEXT
      )
    `);

    // Insert initial data
    for (const variable of rawDashboardData) {
      await db.execute(`
        INSERT OR REPLACE INTO dashboard_variables (
          id,
          name,
          chartGroup,
          calculation,
          sqlExpression,
          p21DataDictionary,
          historicalDate,
          p21,
          por,
          accountsPayableDate,
          total,
          overdue,
          customersDate,
          new,
          prospects,
          inventoryValueDate,
          inventory,
          turnover,
          arAgingDate,
          current,
          aging_1_30,
          aging_31_60,
          aging_61_90,
          aging_90_plus,
          value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        variable.id,
        variable.name,
        variable.chartGroup,
        variable.calculation,
        variable.sqlExpression,
        variable.p21DataDictionary,
        hasHistoricalDate(variable) ? variable.historicalDate : '',
        hasHistoricalDate(variable) ? variable.p21 || '' : '',
        hasHistoricalDate(variable) ? variable.por || '' : '',
        hasAccountsPayableDate(variable) ? variable.accountsPayableDate : '',
        hasAccountsPayableDate(variable) ? variable.total : '',
        hasAccountsPayableDate(variable) ? variable.overdue : '',
        hasCustomersDate(variable) ? variable.customersDate : '',
        hasCustomersDate(variable) ? variable.new : '',
        hasCustomersDate(variable) ? variable.prospects : '',
        hasInventoryDate(variable) ? variable.inventoryValueDate : '',
        hasInventoryDate(variable) ? variable.inventory : '',
        hasInventoryDate(variable) ? variable.turnover : '',
        hasArAgingDate(variable) ? variable.arAgingDate : '',
        hasArAgingDate(variable) ? variable.current || '' : '',
        hasArAgingDate(variable) ? variable.aging_1_30 || '' : '',
        hasArAgingDate(variable) ? variable.aging_31_60 || '' : '',
        hasArAgingDate(variable) ? variable.aging_61_90 || '' : '',
        hasArAgingDate(variable) ? variable.aging_90_plus || '' : '',
        'value' in variable ? variable.value : ''
      ]);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Initialize database
initializeDatabase();

// Database utility functions
async function executeQuery(sql: string, params: any[] = []) {
  try {
    const result = await db.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Failed to execute query:', error);
    throw error;
  }
}

async function isServerConnected() {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Failed to connect to server:', error);
    return false;
  }
}

export { db };