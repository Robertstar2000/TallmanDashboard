'use client';

import { createClient } from '@libsql/client';
import { P21_SCHEMA } from './p21-schema';
import { P21_DATA_DICTIONARY } from './data-dictionary';
import { rawDashboardData } from './raw-data';

const db = createClient({
  url: 'file:dashboard?mode=memory&cache=shared'
});

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
        aging_90_plus TEXT
      )
    `);

    // Insert initial data if table is empty
    const count = await db.execute('SELECT COUNT(*) as count FROM dashboard_variables');
    if (count.rows[0].count === 0) {
      for (const variable of rawDashboardData) {
        await db.execute({
          sql: `
            INSERT INTO dashboard_variables (
              id, name, chartGroup, calculation, sqlExpression, p21DataDictionary,
              historicalDate, p21, por, accountsPayableDate, total, overdue,
              customersDate, new, prospects, inventoryValueDate, inventory,
              turnover, arAgingDate, current, aging_1_30, aging_31_60,
              aging_61_90, aging_90_plus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            variable.id,
            variable.name,
            variable.chartGroup,
            variable.calculation,
            variable.sqlExpression,
            variable.p21DataDictionary,
            ('historicalDate' in variable ? variable.historicalDate : ''),
            ('p21' in variable ? variable.p21 : ''),
            ('por' in variable ? variable.por : ''),
            ('accountsPayableDate' in variable ? variable.accountsPayableDate : ''),
            ('total' in variable ? variable.total : ''),
            ('overdue' in variable ? variable.overdue : ''),
            ('customersDate' in variable ? (variable.customersDate ?? '') : ''),
            ('new' in variable ? (variable.new ?? '') : ''),
            ('prospects' in variable ? (variable.prospects ?? '') : ''),
            ('inventoryValueDate' in variable ? (variable.inventoryValueDate ?? '') : ''),
            ('inventory' in variable ? (variable.inventory ?? '') : ''),
            ('turnover' in variable ? (variable.turnover ?? '') : ''),
            ('arAgingDate' in variable ? (variable.arAgingDate ?? '') : ''),
            ('current' in variable ? (variable.current ?? '') : ''),
            ('aging_1_30' in variable ? (variable.aging_1_30 ?? '') : ''),
            ('aging_31_60' in variable ? (variable.aging_31_60 ?? '') : ''),
            ('aging_61_90' in variable ? (variable.aging_61_90 ?? '') : ''),
            ('aging_90_plus' in variable ? (variable.aging_90_plus ?? '') : '')
          ]
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Initialize database
initializeDatabase();

// Database utility functions
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const result = await db.execute({ sql, args: params });
    return result.rows;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

export async function isServerConnected() {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  }
}

export { db };