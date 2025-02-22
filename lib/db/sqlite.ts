'use server';

import { createClient } from '@libsql/client';
import { P21_SCHEMA } from './p21-schema';
import { P21_DATA_DICTIONARY } from './data-dictionary';
import { rawDashboardData } from './raw-data';

let db: ReturnType<typeof createClient>;

if (process.env.NODE_ENV === 'production') {
  db = createClient({
    url: process.env.DATABASE_URL || 'file:dashboard.db',
  });
} else {
  db = createClient({
    url: 'file:dashboard?mode=memory&cache=shared'
  });
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

      await db.execute({
        sql: `
          CREATE TABLE IF NOT EXISTS ${schema.table} (
            ${fields}
          )
        `,
        args: []
      });
    }

    // Create dashboard variables table
    await db.execute({
      sql: `
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
          aging_90_plus TEXT
        )
      `,
      args: []
    });

    // Insert raw data
    for (const variable of rawDashboardData) {
      await db.execute({
        sql: `
          INSERT OR REPLACE INTO dashboard_variables (
            name, chartGroup, calculation, sqlExpression, p21DataDictionary,
            historicalDate, p21, por, accountsPayableDate, total, overdue,
            customersDate, new, prospects, inventoryValueDate, inventory,
            turnover, arAgingDate, current, aging_1_30, aging_31_60,
            aging_61_90, aging_90_plus
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          variable.name || '',
          variable.chartGroup || '',
          variable.calculation || '',
          variable.sqlExpression || '',
          variable.p21DataDictionary || '',
          variable.historicalDate || '',
          variable.p21 || '',
          variable.por || '',
          variable.accountsPayableDate || '',
          variable.total || '',
          variable.overdue || '',
          variable.customersDate || '',
          variable.new || '',
          variable.prospects || '',
          variable.inventoryValueDate || '',
          variable.inventory || '',
          variable.turnover || '',
          variable.arAgingDate || '',
          variable.current || '',
          variable.aging_1_30 || '',
          variable.aging_31_60 || '',
          variable.aging_61_90 || '',
          variable.aging_90_plus || ''
        ]
      });
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database
initializeDatabase();

// Database utility functions
async function executeQuery(sql: string, params: any[] = []) {
  try {
    const result = await db.execute({
      sql,
      args: params
    });
    return result.rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

async function isServerConnected() {
  try {
    await db.execute({ sql: 'SELECT 1', args: [] });
    return true;
  } catch {
    return false;
  }
}

export { db };