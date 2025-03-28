/**
 * Add DataPoint Column to Chart Data Table
 * 
 * This script adds a DataPoint column to the chart data table
 * in the SQLite database.
 */

import * as path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function addDataPointColumn() {
  try {
    console.log('Starting database schema update...');
    
    // Path to the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Using database at: ${dbPath}`);
    
    // Open database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // List all tables in the database
    console.log('Listing all tables in the database:');
    const tables = await db.all(`SELECT name FROM sqlite_master WHERE type='table';`);
    tables.forEach(table => {
      console.log(`- ${table.name}`);
    });
    
    // Determine the chart data table name (likely chart_data based on previous code)
    const chartDataTable = tables.find(table => 
      table.name.toLowerCase().includes('chart') || 
      table.name.toLowerCase().includes('admin') || 
      table.name.toLowerCase().includes('variables')
    )?.name;
    
    if (!chartDataTable) {
      console.error('Could not find chart data table in the database');
      await db.close();
      return;
    }
    
    console.log(`Found chart data table: ${chartDataTable}`);
    
    // Check the schema of the identified table
    console.log(`Schema for ${chartDataTable}:`);
    const tableInfo = await db.all(`PRAGMA table_info(${chartDataTable})`);
    tableInfo.forEach(column => {
      console.log(`- ${column.name} (${column.type})`);
    });
    
    // Check if the DataPoint column already exists
    const dataPointExists = tableInfo.some(column => column.name === 'DataPoint');
    
    if (dataPointExists) {
      console.log('DataPoint column already exists in the table.');
    } else {
      // Add the DataPoint column
      await db.exec(`ALTER TABLE ${chartDataTable} ADD COLUMN DataPoint TEXT;`);
      console.log(`Successfully added DataPoint column to ${chartDataTable} table.`);
    }
    
    // Close the database connection
    await db.close();
    console.log('Database connection closed.');
    
  } catch (error) {
    console.error('Error updating database schema:', error instanceof Error ? error.message : String(error));
  }
}

// Run the script
addDataPointColumn().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
