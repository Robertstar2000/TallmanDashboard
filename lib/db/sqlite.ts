import * as path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { SpreadsheetRow, ChartGroupSettings } from '../types/dashboard';
import { revalidatePath } from 'next/cache';
import fs from 'fs';

export interface QueryResult {
  value: number | null;
  error?: string;
}

interface DatabaseStatus {
  isHealthy: boolean;
  lastChecked: Date;
  error?: string;
  details: {
    fileAccessible: boolean;
    walModeEnabled: boolean;
    foreignKeysEnabled: boolean;
    tablesInitialized: boolean;
  };
}

// Get or initialize the SQLite database connection
export async function getDb(): Promise<any> {
  try {
    // 1. Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory at ${dataDir}`);
      } else {
        console.log(`Using existing data directory at ${dataDir}`);
      }
    } catch (dirError) {
      const errorDetails = {
        message: dirError instanceof Error ? dirError.message : 'Unknown error',
        stack: dirError instanceof Error ? dirError.stack : 'No stack trace',
        name: dirError instanceof Error ? dirError.name : 'Unknown error type'
      };
      console.error(`Failed to create/verify data directory:`, errorDetails);
      throw new Error(`Data directory error: ${(dirError instanceof Error) ? dirError.message : 'Unknown error'}`);
    }
    
    // Ensure we have write access to the directory
    try {
      const testFile = path.join(dataDir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('Verified write access to data directory');
    } catch (writeError) {
      const errorDetails = {
        message: writeError instanceof Error ? writeError.message : 'Unknown error',
        stack: writeError instanceof Error ? writeError.stack : 'No stack trace',
        name: writeError instanceof Error ? writeError.name : 'Unknown error type'
      };
      console.error(`No write access to data directory:`, errorDetails);
      throw new Error(`No write access to data directory: ${(writeError instanceof Error) ? writeError.message : 'Unknown error'}`);
    }
    
    const dbPath = path.join(dataDir, 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    // Open database connection
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      console.log('Successfully opened SQLite database connection');
      
      // We no longer initialize tables here to avoid circular dependency
      // This will be handled by the initializeDatabase function
      return db;
    } catch (dbError) {
      const errorDetails = {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace',
        name: dbError instanceof Error ? dbError.name : 'Unknown error type'
      };
      console.error(`Failed to open SQLite database:`, errorDetails);
      throw new Error(`Database connection error: ${(dbError instanceof Error) ? dbError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    };
    console.error('Error in getDb():', errorDetails);
    throw new Error(`Failed to connect to database: ${(error instanceof Error) ? error.message : 'Unknown error'}`);
  }
}

// Execute admin query
export async function executeAdminQuery(query: string): Promise<QueryResult> {
  try {
    const db = await getDb();
    
    // Validate and sanitize the query
    if (!query.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed');
    }

    // Execute the query
    const result = await (db as any).get(query);
    await (db as any).close();

    // Extract the first numeric value from the result
    let value: number | null = null;
    if (result) {
      const firstValue = Object.values(result)[0];
      if (typeof firstValue === 'number') {
        value = firstValue;
      } else if (typeof firstValue === 'string') {
        const parsedValue = parseFloat(firstValue);
        if (!isNaN(parsedValue)) {
          value = parsedValue;
        }
      }
    }

    return { value };
  } catch (error) {
    console.error('Error executing admin query:', error);
    return { value: null, error: (error as Error).message };
  }
}

// Execute query for reading data
export async function executeRead(query: string): Promise<any[]> {
  try {
    const db = await getDb();
    const result = await db.all(query);
    await db.close();
    return result;
  } catch (error) {
    console.error('Error executing read query:', error);
    throw new Error('Failed to execute read query');
  }
}

// Execute query for writing data
export async function executeWrite(query: string, params?: any[]): Promise<boolean> {
  try {
    const db = await getDb();
    if (params) {
      await db.run(query, params);
    } else {
      await db.run(query);
    }
    await db.close();
    return true;
  } catch (error) {
    console.error('Error executing write query:', error);
    return false;
  }
}

// Get chart data
export async function getChartData(forceRefresh = false): Promise<SpreadsheetRow[]> {
  try {
    console.log('getChartData: Starting to fetch chart data, forceRefresh =', forceRefresh);
    
    // If we have cached data and forceRefresh is false, return the cached data
    if (global.chartDataCache && !forceRefresh) {
      console.log('getChartData: Using cached chart data, length =', global.chartDataCache.length);
      return global.chartDataCache;
    }
    
    console.log('getChartData: Getting fresh chart data from database');
    
    try {
      console.log('getChartData: Connecting to database...');
      const db = await getDb();
      console.log('getChartData: Database connection successful');
      
      // If forceRefresh is true, clear any cached data
      if (forceRefresh) {
        console.log('getChartData: Forcing refresh of chart data');
        global.chartDataCache = null;
      }
      
      // First check if the transformer column exists
      const tableInfo = await (db as any).all(`PRAGMA table_info(chart_data)`);
      const columns = tableInfo.map((col: any) => col.name);
      console.log('getChartData: Chart data table columns:', columns);
      
      // Build the query based on existing columns
      let query = `
        SELECT 
          id,
          DataPoint,
          chart_group as "chartGroup",
          chart_name as "chartName",
          variable_name as "variableName",
          server_name as "serverName",
          table_name as "tableName",
          calculation,
          production_sql_expression as "productionSqlExpression",
          value,
          last_updated as "lastUpdated"
      `;
      
      // Add optional columns if they exist
      if (columns.includes('transformer')) {
        query += `, transformer`;
      }
      
      if (columns.includes('timeframe')) {
        query += `, timeframe`;
      }
      
      // Complete the query
      query += `
        FROM chart_data
      `;
      
      console.log('getChartData: Executing SQL query to get chart data');
      console.log('getChartData: Query:', query);
      
      const rows = await (db as any).all(query);
      
      console.log('getChartData: SQL query executed, checking results');
      
      // Ensure rows is an array
      if (!rows) {
        console.error('getChartData: No rows returned from database');
        return [];
      }
      
      if (!Array.isArray(rows)) {
        console.error('getChartData: Rows is not an array, type =', typeof rows);
        // Try to convert to array if possible
        const rowsArray = rows ? [rows] : [];
        console.log('getChartData: Converted to array with length =', rowsArray.length);
        return rowsArray;
      }
      
      console.log(`getChartData: Fetched ${rows.length} rows from database`);
      
      // Cache the data for future use
      global.chartDataCache = rows;
      
      // Log a sample of the first row to verify structure
      if (rows.length > 0) {
        console.log('getChartData: First row sample:', JSON.stringify(rows[0]).substring(0, 200) + '...');
      }
      
      // Close the database connection
      await db.close();
      console.log('getChartData: Database connection closed');
      
      return rows;
    } catch (dbError) {
      console.error('getChartData: Database error:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown database error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace',
        name: dbError instanceof Error ? dbError.name : 'Unknown error type'
      });
      
      // Rethrow with more context
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('getChartData: Error fetching chart data:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    
    // Return empty array instead of throwing to prevent cascading errors
    return [];
  }
}

// Update chart data
export async function updateChartData(id: string, row: Partial<SpreadsheetRow>): Promise<void> {
  try {
    const db = await getDb();
    
    // Check if the row exists
    const existingRow = await db.get('SELECT id FROM chart_data WHERE id = ?', [id]);
    
    if (existingRow) {
      // Update existing row
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      if (row.chartName !== undefined) {
        updateFields.push('chart_name = ?');
        updateValues.push(row.chartName);
      }
      
      if (row.chartGroup !== undefined) {
        updateFields.push('chart_group = ?');
        updateValues.push(row.chartGroup);
      }
      
      if (row.variableName !== undefined) {
        updateFields.push('variable_name = ?');
        updateValues.push(row.variableName);
      }
      
      if (row.serverName !== undefined) {
        updateFields.push('server_name = ?');
        updateValues.push(row.serverName || 'P21');
      }
      
      if (row.tableName !== undefined) {
        updateFields.push('table_name = ?');
        updateValues.push(row.tableName);
      }
      
      if (row.calculation !== undefined) {
        updateFields.push('calculation = ?');
        updateValues.push(row.calculation);
      }
      
      if (row.productionSqlExpression !== undefined) {
        updateFields.push('production_sql_expression = ?');
        updateValues.push(normalizeSqlExpression(row.productionSqlExpression));
      }
      
      if (row.value !== undefined) {
        updateFields.push('value = ?');
        updateValues.push(row.value);
      }
      
      if (row.lastUpdated !== undefined) {
        updateFields.push('last_updated = ?');
        updateValues.push(row.lastUpdated);
      } else {
        // Always update the last_updated timestamp
        updateFields.push('last_updated = ?');
        updateValues.push(new Date().toISOString());
      }
      
      if (updateFields.length > 0) {
        const query = `UPDATE chart_data SET ${updateFields.join(', ')} WHERE id = ?`;
        updateValues.push(id);
        
        await db.run(query, updateValues);
        console.log(`Updated chart_data row with ID ${id}`);
      }
    } else {
      // Insert new row
      await db.run(
        `INSERT INTO chart_data (id, DataPoint, chart_name, chart_group, variable_name, server_name, table_name, calculation, production_sql_expression, value, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          row.DataPoint || '',
          row.chartName || '',
          row.chartGroup || '',
          row.variableName || '',
          row.serverName || 'P21',
          row.tableName || '',
          row.calculation || '',
          normalizeSqlExpression(row.productionSqlExpression || ''),
          row.value || '',
          row.lastUpdated || new Date().toISOString()
        ]
      );
      console.log(`Inserted new chart_data row with ID ${id}`);
    }
    
    // Revalidate the pages that display this data
    revalidatePath('/admin');
    revalidatePath('/');
    
    return;
  } catch (error) {
    console.error('Error updating chart data:', error);
    throw new Error(`Failed to update chart data: ${(error as Error).message}`);
  }
}

// Save spreadsheet row
export async function saveSpreadsheetRow(row: SpreadsheetRow): Promise<void> {
  // Use the existing updateChartData function to save the row
  await updateChartData(row.id, row);
  
  // No need to close DB connection as updateChartData already does this
}

// Update all rows
export async function updateAllRows(rows: SpreadsheetRow[]): Promise<void> {
  try {
    const db = await getDb();
    
    for (const row of rows) {
      await updateChartData(row.id, row);
    }
    
    await db.close();
  } catch (error) {
    console.error('Error updating all rows:', error);
    throw new Error(`Failed to update all rows: ${(error as Error).message}`);
  }
}

// Initialize database tables and sample data
export async function initializeDatabaseTables(db: any): Promise<void> {
  console.log('Creating database tables...');
  
  try {
    // Create chart_data table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chart_data (
        id TEXT PRIMARY KEY,
        DataPoint TEXT,
        chart_name TEXT,
        chart_group TEXT NOT NULL,
        variable_name TEXT,
        server_name TEXT,
        table_name TEXT,
        calculation TEXT,
        production_sql_expression TEXT,
        value TEXT,
        last_updated TEXT
      )
    `);
    
    // Check if chart_data table is empty
    const chartDataCount = await db.get('SELECT COUNT(*) as count FROM chart_data');
    console.log(`chart_data table has ${chartDataCount.count} rows`);
    
    // Always clear existing data and re-initialize
    console.log('Clearing existing chart data...');
    await db.run('DELETE FROM chart_data');
    
    console.log('Inserting sample data...');
    
    // Import the initial spreadsheet data
    const { dashboardData } = await import('./single-source-data');
    
    if (!Array.isArray(dashboardData)) {
      console.error('Error: dashboardData is not an array');
      throw new Error('Invalid dashboardData format');
    }
    
    console.log(`Loaded ${dashboardData.length} rows from initialization file`);
    
    // Prepare the data for insertion
    let insertedCount = 0;
    let errorCount = 0;
    
    for (const row of dashboardData) {
      try {
        // Validate required fields
        if (!row.id || !row.chartGroup) {
          console.warn(`Skipping row with missing required fields: ${JSON.stringify(row)}`);
          continue;
        }
        
        await db.run(
          `INSERT INTO chart_data (id, DataPoint, chart_name, chart_group, variable_name, server_name, table_name, calculation, production_sql_expression, value, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.DataPoint || '',
            row.chartName || '',
            row.chartGroup || '',
            row.variableName || '',
            row.serverName || 'P21',
            row.tableName || '',
            row.calculation || '',
            normalizeSqlExpression(row.productionSqlExpression || ''),
            row.value || '',
            row.lastUpdated || new Date().toISOString()
          ]
        );
        insertedCount++;
        
        if (insertedCount % 50 === 0) {
          console.log(`Inserted ${insertedCount} rows so far...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error inserting row ${row.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Row data:', JSON.stringify(row));
      }
    }
    
    console.log(`Sample data insertion complete. Inserted ${insertedCount} rows with ${errorCount} errors.`);
    
    // Verify the data was inserted
    const verifyCount = await db.get('SELECT COUNT(*) as count FROM chart_data');
    console.log(`After initialization, chart_data table has ${verifyCount.count} rows`);
    
    if (verifyCount.count === 0) {
      console.error('ERROR: No data was inserted into the chart_data table!');
      throw new Error('Failed to insert data into chart_data table');
    }
    
    // Force clear any cached data
    global.chartDataCache = null;
    
  } catch (error) {
    console.error('Error initializing database tables:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

// Helper functions for default values
function getDefaultTableName(metricName: string): string {
  const name = metricName.toLowerCase();
  
  if (name.includes('revenue') || name.includes('sales')) {
    return 'invoice_hdr';
  } else if (name.includes('order') || name.includes('orders')) {
    return 'order_hdr';
  } else if (name.includes('customer') || name.includes('customers')) {
    return 'customer_mst';
  } else if (name.includes('inventory') || name.includes('stock')) {
    return 'inv_mst';
  } else if (name.includes('web')) {
    return 'web_order_hdr';
  } else if (name.includes('aging') || name.includes('receivable')) {
    return 'ar_open_items';
  } else if (name.includes('payable')) {
    return 'ap_open_items';
  } else if (name.includes('site') || name.includes('distribution')) {
    return 'location_mst';
  }
  
  // Default table
  return 'dashboard_metrics';
}

function getDefaultProductionSql(metricName: string): string {
  const name = metricName.toLowerCase();
  
  if (name.includes('revenue') || name.includes('total revenue')) {
    return `SELECT SUM(invoice_total) 
FROM invoice_hdr 
WHERE invoice_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('total orders')) {
    return `SELECT COUNT(*) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('active customers')) {
    return `SELECT COUNT(DISTINCT customer_id) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -3, GETDATE())`;
  } else if (name.includes('average order')) {
    return `SELECT AVG(order_total) 
FROM order_hdr 
WHERE order_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('web orders')) {
    return `SELECT COUNT(*) 
FROM order_hdr 
WHERE order_source = 'WEB' AND order_date >= DATEADD(month, -1, GETDATE())`;
  } else if (name.includes('inventory value')) {
    return `SELECT SUM(qty_on_hand * avg_cost) 
FROM inv_mst`;
  } else if (name.includes('aging') && name.includes('amount')) {
    if (name.includes('1-30') || name.includes('30')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30`;
    } else if (name.includes('31-60') || name.includes('60')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60`;
    } else if (name.includes('61-90') || name.includes('90')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90`;
    } else if (name.includes('90+') || name.includes('over')) {
      return `SELECT SUM(open_amount) 
FROM ar_open_items 
WHERE days_past_due > 90`;
    }
  } else if (name.includes('aging') && name.includes('count')) {
    if (name.includes('1-30') || name.includes('30')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 1 AND 30`;
    } else if (name.includes('31-60') || name.includes('60')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 31 AND 60`;
    } else if (name.includes('61-90') || name.includes('90')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due BETWEEN 61 AND 90`;
    } else if (name.includes('90+') || name.includes('over')) {
      return `SELECT COUNT(*) 
FROM ar_open_items 
WHERE days_past_due > 90`;
    }
  }
  
  // Default SQL
  return `SELECT COUNT(*) FROM ${getDefaultTableName(metricName)} WHERE 1=1`;
}

function getDefaultTransformer(metricName: string): string {
  const name = metricName.toLowerCase();
  
  if (name.includes('revenue') || name.includes('value') || name.includes('amount')) {
    return 'currency';
  } else if (name.includes('count') || name.includes('orders') || name.includes('customers')) {
    return 'number';
  } else if (name.includes('percent') || name.includes('rate')) {
    return 'percent';
  }
  
  // Default transformer
  return 'number';
}

// Helper function to normalize SQL expressions with embedded newlines and brackets
function normalizeSqlExpression(sql: string): string {
  if (!sql) return '';
  
  // Replace newlines and extra spaces
  let normalizedSql = sql.replace(/\s+/g, ' ').trim();
  
  // Fix MS Access date functions that might be split across lines
  normalizedSql = normalizedSql.replace(/DatePart\(\s*'m'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('m', [RentalDate])");
  normalizedSql = normalizedSql.replace(/DatePart\(\s*'yyyy'\s*,\s*\[\s*RentalDate\s*\]\s*\)/g, "DatePart('yyyy', [RentalDate])");
  
  return normalizedSql;
}

// Test SQLite connection
export async function testSqliteConnection(): Promise<{ isConnected: boolean; error?: string }> {
  try {
    // First try the main SQLite database
    const db = await getDb();
    
    // Simple test query
    await (db as any).get('SELECT 1 as test');
    
    // Close the connection
    await (db as any).close();
    
    // Also test the test database initialization
    try {
      const { initTestDb } = require('./test-db');
      await initTestDb();
      console.log('Test database initialized successfully during connection test');
    } catch (testDbError) {
      console.warn('Test database initialization warning:', testDbError);
      // Don't fail the connection test if test DB fails
    }
    
    return { isConnected: true };
  } catch (error) {
    console.error('SQLite connection test failed:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return { 
      isConnected: false, 
      error: error instanceof Error ? error.message : 'Failed to connect to SQLite database' 
    };
  }
}

// Check database health
export async function checkDatabaseHealth(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    isHealthy: false,
    lastChecked: new Date(),
    details: {
      fileAccessible: false,
      walModeEnabled: false,
      foreignKeysEnabled: false,
      tablesInitialized: false
    }
  };

  try {
    const db = await getDb();
    status.details.fileAccessible = true;

    // Check WAL mode
    const journalMode = await (db as any).get('PRAGMA journal_mode');
    status.details.walModeEnabled = journalMode.journal_mode === 'wal';

    // Check foreign keys
    const foreignKeys = await (db as any).get('PRAGMA foreign_keys');
    status.details.foreignKeysEnabled = Boolean(foreignKeys.foreign_keys);

    // Check if tables exist
    const tables = await (db as any).all("SELECT name FROM sqlite_master WHERE type='table'");
    status.details.tablesInitialized = tables.some((t: { name: string }) => t.name === 'chart_data');

    // Set overall health
    status.isHealthy = Object.values(status.details).every(Boolean);

    await (db as any).close();
  } catch (error) {
    console.error('Error checking database health:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    status.error = error instanceof Error ? error.message : 'Unknown error occurred';
  }

  return status;
}

/**
 * Loads all database content from the single source data file
 * This includes chart data, chart group settings, and connection data
 */
export async function loadDbFromInitFile(): Promise<void> {
  console.log('Loading database content from single source data file...');
  try {
    const db = await getDb();
    
    // Import the single source data directly
    const { dashboardData, chartGroupSettings, serverConfigs } = await import('./single-source-data');
    
    console.log(`Loaded ${dashboardData.length} rows from single source data file`);
    
    // Begin transaction
    await (db as any).run('BEGIN TRANSACTION');
    
    try {
      // 1. Process chart data
      console.log('Processing chart data...');
      
      // Check if the chart_data table exists
      const chartDataTableExists = await (db as any).get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='chart_data'
      `);
      
      if (!chartDataTableExists) {
        console.log('chart_data table does not exist, creating it...');
        await (db as any).exec(`
          CREATE TABLE IF NOT EXISTS chart_data (
            id TEXT PRIMARY KEY,
            DataPoint TEXT,
            chart_name TEXT,
            chart_group TEXT NOT NULL,
            variable_name TEXT,
            server_name TEXT,
            table_name TEXT,
            calculation TEXT,
            production_sql_expression TEXT,
            value TEXT,
            last_updated TEXT
          )
        `);
      } else {
        // Check if DataPoint column exists
        const columns = await (db as any).all('PRAGMA table_info(chart_data)');
        const hasDataPoint = columns.some((col: any) => col.name === 'DataPoint');
        
        if (!hasDataPoint) {
          console.log('Adding DataPoint column to chart_data table...');
          await (db as any).exec('ALTER TABLE chart_data ADD COLUMN DataPoint TEXT');
        }
      }
      
      // First, clear all existing chart data
      await (db as any).run('DELETE FROM chart_data');
      console.log('Cleared existing chart data');
      
      // Process each row from the single source data
      for (const row of dashboardData) {
        if (row.chartGroup && row.variableName) {
          // Convert the row to the format expected by the chart_data table
          const chartDataRow = {
            id: row.id,
            DataPoint: row.DataPoint || '',
            chartName: row.chartName || '',
            chartGroup: row.chartGroup || '',
            variableName: row.variableName || '',
            serverName: row.serverName || '',
            tableName: row.tableName || '',
            calculation: row.calculation || 'number',
            productionSqlExpression: row.productionSqlExpression || row.calculation || '',
            value: row.value || '0',
            lastUpdated: row.lastUpdated || new Date().toISOString()
          };
          
          // Insert new row (we've already cleared the table)
          await (db as any).run(`
            INSERT INTO chart_data (
              id,
              DataPoint,
              chart_name,
              chart_group,
              variable_name,
              server_name,
              table_name,
              calculation,
              production_sql_expression,
              value,
              last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            chartDataRow.id,
            chartDataRow.DataPoint,
            chartDataRow.chartName,
            chartDataRow.chartGroup,
            chartDataRow.variableName,
            chartDataRow.serverName,
            chartDataRow.tableName,
            chartDataRow.calculation,
            chartDataRow.productionSqlExpression,
            chartDataRow.value,
            chartDataRow.lastUpdated
          ]);
        }
      }
      
      // 2. Process chart group settings if available
      if (chartGroupSettings && Array.isArray(chartGroupSettings) && chartGroupSettings.length > 0) {
        console.log('Processing chart group settings...');
        
        // Check if the chart_groups table exists
        const chartGroupsTableExists = await (db as any).get(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='chart_groups'
        `);
        
        if (!chartGroupsTableExists) {
          console.log('chart_groups table does not exist, creating it...');
          await (db as any).exec(`
            CREATE TABLE IF NOT EXISTS chart_groups (
              id TEXT PRIMARY KEY,
              name TEXT,
              display_order INTEGER,
              is_visible INTEGER DEFAULT 1,
              settings TEXT
            )
          `);
        }
        
        // Clear existing chart group settings
        await (db as any).run('DELETE FROM chart_groups');
        console.log('Cleared existing chart group settings');
        
        // Insert chart group settings
        for (const group of chartGroupSettings) {
          await (db as any).run(`
            INSERT INTO chart_groups (id, name, display_order, is_visible, settings)
            VALUES (?, ?, ?, ?, ?)
          `, [
            group.id,
            group.name,
            group.display_order || 0,
            group.is_visible || 1,
            JSON.stringify(group.settings || {})
          ]);
        }
      }
      
      // 3. Process server configurations if available
      if (serverConfigs && Array.isArray(serverConfigs) && serverConfigs.length > 0) {
        console.log('Processing server configurations...');
        
        // Check if the server_configs table exists
        const serverConfigsTableExists = await (db as any).get(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name='server_configs'
        `);
        
        if (!serverConfigsTableExists) {
          console.log('server_configs table does not exist, creating it...');
          await (db as any).exec(`
            CREATE TABLE IF NOT EXISTS server_configs (
              id TEXT PRIMARY KEY,
              server_name TEXT,
              host TEXT,
              port INTEGER,
              database TEXT,
              username TEXT,
              password TEXT,
              is_active INTEGER DEFAULT 1,
              connection_type TEXT,
              server TEXT,
              created_at TEXT,
              updated_at TEXT,
              config TEXT
            )
          `);
        }
        
        // Clear existing server configurations
        await (db as any).run('DELETE FROM server_configs');
        console.log('Cleared existing server configurations');
        
        // Insert server configurations
        for (const config of serverConfigs) {
          await (db as any).run(`
            INSERT INTO server_configs (
              id, 
              server_name, 
              host, 
              port, 
              database, 
              username, 
              password, 
              is_active,
              connection_type,
              server,
              created_at,
              updated_at,
              config
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            config.id,
            config.name || config.server_name || '',
            config.host || '',
            config.port || 0,
            config.database || '',
            config.username || '',
            config.password || '',
            config.is_active || 1,
            config.connection_type || 'sqlserver',
            config.server || '',
            config.created_at || new Date().toISOString(),
            config.updated_at || new Date().toISOString(),
            JSON.stringify(config.config || {})
          ]);
        }
      }
      
      // Commit all changes
      await (db as any).run('COMMIT');
      console.log('Successfully committed all changes to database');
      
    } catch (error) {
      // Rollback transaction on error
      await (db as any).run('ROLLBACK');
      console.error('Error during database update, rolled back changes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error loading database content from single source data file:', error);
    throw error;
  }
}

/**
 * Saves all database content to the single source data file
 * This includes chart data, chart group settings, and connection data
 */
export async function saveDbToInitFile(): Promise<void> {
  console.log('Saving database content to single source data file...');
  try {
    const db = await getDb();
    
    // Get all chart data
    const chartData = await (db as any).all(`
      SELECT 
        id,
        DataPoint,
        chart_group as "chartGroup",
        chart_name as "chartName",
        variable_name as "variableName",
        server_name as "serverName",
        table_name as "tableName",
        calculation,
        production_sql_expression as "productionSqlExpression",
        value,
        last_updated as "lastUpdated",
        transformer,
        timeframe
      FROM chart_data
    `);
    
    console.log(`Retrieved ${chartData.length} rows of chart data`);
    
    // Process chart data to ensure all fields have valid values
    const processedChartData = chartData.map((row: any) => {
      return {
        id: row.id || '',
        DataPoint: row.DataPoint || '',
        chartGroup: row.chartGroup || '',
        chartName: row.chartName || '',
        variableName: row.variableName || '',
        serverName: row.serverName || '',
        tableName: row.tableName || '',
        calculation: row.calculation || 'number',
        productionSqlExpression: row.productionSqlExpression || row.calculation || '',
        value: row.value || '0',
        lastUpdated: row.lastUpdated || new Date().toISOString()
      };
    });
    
    // Get chart group settings
    const chartGroupSettings = await (db as any).all(`
      SELECT 
        id,
        name,
        display_order,
        is_visible,
        settings
      FROM chart_groups
    `);
    
    console.log(`Retrieved ${chartGroupSettings.length} chart group settings`);
    
    // Process chart group settings
    const processedChartGroupSettings = chartGroupSettings.map((group: any) => {
      let settings = {};
      try {
        settings = JSON.parse(group.settings || '{}');
      } catch (error) {
        console.warn(`Error parsing settings for chart group ${group.id}:`, error);
      }
      
      return {
        id: group.id || '',
        name: group.name || '',
        display_order: group.display_order || 0,
        is_visible: group.is_visible || 1,
        settings
      };
    });
    
    // Get server configs
    const serverConfigs = await (db as any).all(`
      SELECT 
        id,
        server_name,
        host,
        port,
        database,
        username,
        password,
        is_active,
        connection_type,
        server,
        created_at,
        updated_at,
        config
      FROM server_configs
    `);
    
    console.log(`Retrieved ${serverConfigs.length} server configs`);
    
    // Process server configs
    const processedServerConfigs = serverConfigs.map((config: any) => {
      let configObj = {};
      try {
        configObj = JSON.parse(config.config || '{}');
      } catch (error) {
        console.warn(`Error parsing config for server ${config.server_name}:`, error);
      }
      
      return {
        id: config.id || '',
        name: config.server_name || '',
        host: config.host || '',
        port: config.port || 0,
        database: config.database || '',
        username: config.username || '',
        password: config.password || '',
        is_active: config.is_active || 1,
        connection_type: config.connection_type || 'sqlserver',
        server: config.server || '',
        created_at: config.created_at || new Date().toISOString(),
        updated_at: config.updated_at || new Date().toISOString(),
        config: configObj
      };
    });
    
    // Generate the file content
    const timestamp = new Date().toISOString();
    const fileContent = `/**
 * SINGLE SOURCE OF TRUTH for dashboard data
 * 
 * This file contains all SQL expressions, chart configurations, and server settings
 * for the Tallman Dashboard. This is the authoritative source that the database
 * will be initialized from.
 * 
 * When changes are made to the database through the admin interface, the "Save DB"
 * button will update this file directly.
 * 
 * When the "Load DB" button is clicked, the database will be populated from this file.
 * 
 * Last updated: ${timestamp}
 */

import type { SpreadsheetRow, ChartGroupSetting, ServerConfig } from './types';

// Chart data for the dashboard
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(processedChartData, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
    
    // Write the file
    const filePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
    fs.writeFileSync(filePath, fileContent);
    
    console.log(`Successfully saved database content to: ${filePath}`);
  } catch (error) {
    console.error('Error saving database content to single source data file:', error);
    throw error;
  }
}

// Keep aliases for backward compatibility
export const loadChartDataFromInitFile = loadDbFromInitFile;
export const saveChartDataToInitFile = saveDbToInitFile;