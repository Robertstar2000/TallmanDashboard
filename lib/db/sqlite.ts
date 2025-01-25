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
        columbus TEXT,
        addison TEXT,
        lakeCity TEXT
      )
    `);

    // Initialize with raw data if empty
    const result = await db.execute('SELECT COUNT(*) as count FROM dashboard_variables');
    if (result.rows[0].count === 0) {
      for (const row of rawDashboardData) {
        let values: any[] = [
          row.id,
          row.name,
          row.chartGroup,
          row.calculation,
          row.sqlExpression,
          row.p21DataDictionary,
          null, // historicalDate
          null, // p21
          null, // por
          null, // accountsPayableDate
          null, // total
          null, // overdue
          null, // customersDate
          null, // new
          null, // prospects
          null, // inventoryValueDate
          null, // inventory
          null, // turnover
          null, // columbus
          null, // addison
          null  // lakeCity
        ];

        // Update values based on the type of data
        if ('historicalDate' in row && 'p21' in row && 'por' in row) {
          values[6] = row.historicalDate;
          values[7] = row.p21;
          values[8] = row.por;
        } else if ('accountsPayableDate' in row && 'total' in row && 'overdue' in row) {
          values[9] = row.accountsPayableDate;
          values[10] = row.total;
          values[11] = row.overdue;
        } else if ('customersDate' in row && 'new' in row && 'prospects' in row) {
          values[12] = row.customersDate;
          values[13] = row.new;
          values[14] = row.prospects;
        } else if ('inventoryValueDate' in row && 'inventory' in row && 'turnover' in row) {
          values[15] = row.inventoryValueDate;
          values[16] = row.inventory;
          values[17] = row.turnover;
        } else if ('columbus' in row && 'addison' in row && 'lakeCity' in row) {
          values[18] = row.columbus;
          values[19] = row.addison;
          values[20] = row.lakeCity;
        }

        const sql = `
          INSERT INTO dashboard_variables 
          (id, name, chartGroup, calculation, sqlExpression, p21DataDictionary,
           historicalDate, p21, por, accountsPayableDate, total, overdue,
           customersDate, new, prospects, inventoryValueDate, inventory, turnover,
           columbus, addison, lakeCity)
          VALUES (${values.map(() => '?').join(', ')})
        `;
        await db.execute({
          sql,
          args: values
        });
      }
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Initialize database
initializeDatabase();

export { db };