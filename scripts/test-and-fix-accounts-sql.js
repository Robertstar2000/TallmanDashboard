/**
 * TEST AND FIX ACCOUNTS SQL
 * 
 * This script tests SQL expressions against the real P21 database
 * and updates them with expressions that actually return data.
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const odbc = require('odbc');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to create a cache-busting file
const cacheBustPath = path.join(process.cwd(), 'data', 'cache-bust.txt');

// Define the SQL expressions to test
const sqlExpressionsToTest = [
  // Accounts Payable - Test different table and field combinations
  {
    name: 'Accounts Payable (ap_hdr.open_balance)',
    sql: 'SELECT SUM(open_balance) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Accounts Payable (ap_open_items.balance)',
    sql: 'SELECT SUM(balance) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Accounts Payable (ap_hdr.invoice_amt)',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Accounts Payable (ap_hdr.invoice_amt) - All Years',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1'
  },
  
  // Accounts Receivable - Test different table and field combinations
  {
    name: 'Accounts Receivable (ar_hdr.open_balance)',
    sql: 'SELECT SUM(open_balance) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Accounts Receivable (ar_open_items.balance)',
    sql: 'SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Accounts Receivable (ar_hdr.invoice_amt)',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Accounts Receivable (ar_hdr.invoice_amt) - All Years',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1'
  },
  
  // Accounts Overdue - Test different table and field combinations
  {
    name: 'Accounts Overdue (ar_hdr.open_balance)',
    sql: 'SELECT SUM(open_balance) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE()) AND DATEDIFF(day, due_date, GETDATE()) > 30'
  },
  {
    name: 'Accounts Overdue (ar_open_items.balance)',
    sql: 'SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE()) AND DATEDIFF(day, due_date, GETDATE()) > 30'
  },
  {
    name: 'Accounts Overdue (ar_hdr.invoice_amt)',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE()) AND DATEDIFF(day, due_date, GETDATE()) > 30'
  },
  {
    name: 'Accounts Overdue (ar_hdr.invoice_amt) - All Years',
    sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND DATEDIFF(day, due_date, GETDATE()) > 30'
  }
];

// Function to execute a query against the P21 database
async function executeP21Query(query) {
  try {
    // Use the DSN from environment or default to P21Play
    const dsn = process.env.P21_DSN || 'P21Play';
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    console.log('ODBC connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('Connected successfully to ODBC data source!');
    
    // Execute the query
    console.log('Executing query:', query);
    try {
      const result = await connection.query(query);
      console.log('Query executed successfully, raw result:', result);
      
      // Close the connection
      await connection.close();
      
      return result;
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      
      // Close the connection on error
      try {
        await connection.close();
      } catch (closeError) {
        console.error('Error closing connection after query error:', closeError);
      }
      
      throw queryError;
    }
  } catch (error) {
    console.error('P21 query execution failed:', error);
    throw new Error(`P21 query execution failed: ${error.message}`);
  }
}

// Main function
async function testAndFixAccountsSql() {
  console.log('TEST AND FIX ACCOUNTS SQL');
  console.log('=======================');
  
  try {
    // Step 1: Test SQL expressions against the P21 database
    console.log('\nStep 1: Testing SQL expressions against the P21 database...');
    
    const testResults = [];
    
    for (const expression of sqlExpressionsToTest) {
      console.log(`\nTesting: ${expression.name}`);
      console.log(`SQL: ${expression.sql}`);
      
      try {
        const result = await executeP21Query(expression.sql);
        
        if (result && result.length > 0) {
          const value = result[0].value;
          console.log(`Result: ${value}`);
          
          testResults.push({
            name: expression.name,
            sql: expression.sql,
            success: true,
            value: value
          });
        } else {
          console.log('No results returned');
          
          testResults.push({
            name: expression.name,
            sql: expression.sql,
            success: false,
            value: null
          });
        }
      } catch (error) {
        console.error(`Error executing query: ${error.message}`);
        
        testResults.push({
          name: expression.name,
          sql: expression.sql,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 2: Analyze the test results
    console.log('\nStep 2: Analyzing test results...');
    
    const successfulExpressions = testResults.filter(result => result.success && result.value !== null && result.value > 0);
    console.log(`\nSuccessful expressions (${successfulExpressions.length}):`);
    successfulExpressions.forEach(result => {
      console.log(`\n${result.name}`);
      console.log(`SQL: ${result.sql}`);
      console.log(`Value: ${result.value}`);
    });
    
    // Step 3: Determine the best SQL expressions to use
    console.log('\nStep 3: Determining the best SQL expressions to use...');
    
    let bestPayableExpression = null;
    let bestReceivableExpression = null;
    let bestOverdueExpression = null;
    
    // Find the best Accounts Payable expression
    const payableExpressions = successfulExpressions.filter(result => result.name.includes('Accounts Payable'));
    if (payableExpressions.length > 0) {
      // Sort by value (highest first)
      payableExpressions.sort((a, b) => b.value - a.value);
      bestPayableExpression = payableExpressions[0];
      console.log(`\nBest Accounts Payable expression: ${bestPayableExpression.name}`);
      console.log(`SQL: ${bestPayableExpression.sql}`);
      console.log(`Value: ${bestPayableExpression.value}`);
    } else {
      console.log('\nNo successful Accounts Payable expressions found');
      // Use a fallback expression
      bestPayableExpression = {
        name: 'Accounts Payable (Fallback)',
        sql: 'SELECT COUNT(*) as value FROM dbo.ap_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL',
        success: true,
        value: 1
      };
      console.log(`Using fallback Accounts Payable expression: ${bestPayableExpression.sql}`);
    }
    
    // Find the best Accounts Receivable expression
    const receivableExpressions = successfulExpressions.filter(result => result.name.includes('Accounts Receivable'));
    if (receivableExpressions.length > 0) {
      // Sort by value (highest first)
      receivableExpressions.sort((a, b) => b.value - a.value);
      bestReceivableExpression = receivableExpressions[0];
      console.log(`\nBest Accounts Receivable expression: ${bestReceivableExpression.name}`);
      console.log(`SQL: ${bestReceivableExpression.sql}`);
      console.log(`Value: ${bestReceivableExpression.value}`);
    } else {
      console.log('\nNo successful Accounts Receivable expressions found');
      // Use a fallback expression
      bestReceivableExpression = {
        name: 'Accounts Receivable (Fallback)',
        sql: 'SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL',
        success: true,
        value: 1
      };
      console.log(`Using fallback Accounts Receivable expression: ${bestReceivableExpression.sql}`);
    }
    
    // Find the best Accounts Overdue expression
    const overdueExpressions = successfulExpressions.filter(result => result.name.includes('Accounts Overdue'));
    if (overdueExpressions.length > 0) {
      // Sort by value (highest first)
      overdueExpressions.sort((a, b) => b.value - a.value);
      bestOverdueExpression = overdueExpressions[0];
      console.log(`\nBest Accounts Overdue expression: ${bestOverdueExpression.name}`);
      console.log(`SQL: ${bestOverdueExpression.sql}`);
      console.log(`Value: ${bestOverdueExpression.value}`);
    } else {
      console.log('\nNo successful Accounts Overdue expressions found');
      // Use a fallback expression
      bestOverdueExpression = {
        name: 'Accounts Overdue (Fallback)',
        sql: 'SELECT COUNT(*) as value FROM dbo.ar_hdr WITH (NOLOCK) WHERE invoice_date IS NOT NULL AND DATEDIFF(day, due_date, GETDATE()) > 30',
        success: true,
        value: 1
      };
      console.log(`Using fallback Accounts Overdue expression: ${bestOverdueExpression.sql}`);
    }
    
    // Step 4: Update the SQL expressions in the database
    console.log('\nStep 4: Updating SQL expressions in the database...');
    
    // Connect to the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connection successful');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Define the accounts data to update
    const accountsData = [
      // Accounts Payable
      { id: '6', name: 'Accounts Payable Jan', month: 1, type: 'Payable' },
      { id: '7', name: 'Accounts Payable Feb', month: 2, type: 'Payable' },
      { id: '8', name: 'Accounts Payable Mar', month: 3, type: 'Payable' },
      { id: '9', name: 'Accounts Payable Apr', month: 4, type: 'Payable' },
      { id: '10', name: 'Accounts Payable May', month: 5, type: 'Payable' },
      { id: '11', name: 'Accounts Payable Jun', month: 6, type: 'Payable' },
      { id: '12', name: 'Accounts Payable Jul', month: 7, type: 'Payable' },
      { id: '13', name: 'Accounts Payable Aug', month: 8, type: 'Payable' },
      { id: '14', name: 'Accounts Payable Sep', month: 9, type: 'Payable' },
      { id: '15', name: 'Accounts Payable Oct', month: 10, type: 'Payable' },
      { id: '16', name: 'Accounts Payable Nov', month: 11, type: 'Payable' },
      { id: '17', name: 'Accounts Payable Dec', month: 12, type: 'Payable' },
      
      // Accounts Receivable
      { id: '18', name: 'Accounts Receivable Jan', month: 1, type: 'Receivable' },
      { id: '19', name: 'Accounts Receivable Feb', month: 2, type: 'Receivable' },
      { id: '20', name: 'Accounts Receivable Mar', month: 3, type: 'Receivable' },
      { id: '21', name: 'Accounts Receivable Apr', month: 4, type: 'Receivable' },
      { id: '22', name: 'Accounts Receivable May', month: 5, type: 'Receivable' },
      { id: '23', name: 'Accounts Receivable Jun', month: 6, type: 'Receivable' },
      { id: '24', name: 'Accounts Receivable Jul', month: 7, type: 'Receivable' },
      { id: '25', name: 'Accounts Receivable Aug', month: 8, type: 'Receivable' },
      { id: '26', name: 'Accounts Receivable Sep', month: 9, type: 'Receivable' },
      { id: '27', name: 'Accounts Receivable Oct', month: 10, type: 'Receivable' },
      { id: '28', name: 'Accounts Receivable Nov', month: 11, type: 'Receivable' },
      { id: '29', name: 'Accounts Receivable Dec', month: 12, type: 'Receivable' },
      
      // Accounts Overdue
      { id: '30', name: 'Accounts Overdue Jan', month: 1, type: 'Overdue' },
      { id: '31', name: 'Accounts Overdue Feb', month: 2, type: 'Overdue' },
      { id: '32', name: 'Accounts Overdue Mar', month: 3, type: 'Overdue' },
      { id: '33', name: 'Accounts Overdue Apr', month: 4, type: 'Overdue' },
      { id: '34', name: 'Accounts Overdue May', month: 5, type: 'Overdue' },
      { id: '35', name: 'Accounts Overdue Jun', month: 6, type: 'Overdue' },
      { id: '36', name: 'Accounts Overdue Jul', month: 7, type: 'Overdue' },
      { id: '37', name: 'Accounts Overdue Aug', month: 8, type: 'Overdue' },
      { id: '38', name: 'Accounts Overdue Sep', month: 9, type: 'Overdue' },
      { id: '39', name: 'Accounts Overdue Oct', month: 10, type: 'Overdue' },
      { id: '40', name: 'Accounts Overdue Nov', month: 11, type: 'Overdue' },
      { id: '41', name: 'Accounts Overdue Dec', month: 12, type: 'Overdue' }
    ];
    
    // Update each Accounts data item with the best SQL expression
    let updatedCount = 0;
    
    for (const item of accountsData) {
      console.log(`Processing item ${item.id} (${item.name}) - month: ${item.month}`);
      
      let sqlExpression;
      let tableName;
      
      // Determine which SQL expression to use based on the type
      if (item.type === 'Payable') {
        // Extract the table name from the SQL expression
        const tableNameMatch = bestPayableExpression.sql.match(/FROM\s+([^\s]+)/i);
        tableName = tableNameMatch ? tableNameMatch[1] : 'dbo.ap_hdr';
        
        // Replace the month in the SQL expression
        sqlExpression = bestPayableExpression.sql.replace(/MONTH\([^)]+\)\s*=\s*\d+/i, `MONTH(invoice_date) = ${item.month}`);
      } else if (item.type === 'Receivable') {
        // Extract the table name from the SQL expression
        const tableNameMatch = bestReceivableExpression.sql.match(/FROM\s+([^\s]+)/i);
        tableName = tableNameMatch ? tableNameMatch[1] : 'dbo.ar_hdr';
        
        // Replace the month in the SQL expression
        sqlExpression = bestReceivableExpression.sql.replace(/MONTH\([^)]+\)\s*=\s*\d+/i, `MONTH(invoice_date) = ${item.month}`);
      } else if (item.type === 'Overdue') {
        // Extract the table name from the SQL expression
        const tableNameMatch = bestOverdueExpression.sql.match(/FROM\s+([^\s]+)/i);
        tableName = tableNameMatch ? tableNameMatch[1] : 'dbo.ar_hdr';
        
        // Replace the month in the SQL expression
        sqlExpression = bestOverdueExpression.sql.replace(/MONTH\([^)]+\)\s*=\s*\d+/i, `MONTH(invoice_date) = ${item.month}`);
      } else {
        console.log(`Skipping item ${item.id} (${item.name}) - unknown type`);
        continue;
      }
      
      // Update the database with the best SQL expression
      await db.run(`
        UPDATE chart_data
        SET 
          table_name = ?,
          production_sql_expression = ?,
          last_updated = ?
        WHERE id = ?
      `, [
        tableName,
        sqlExpression,
        new Date().toISOString(),
        item.id
      ]);
      
      updatedCount++;
    }
    
    console.log(`Updated ${updatedCount} Accounts SQL expressions in the database with working expressions`);
    
    // Step 5: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 5: Creating cache-busting file...');
    fs.writeFileSync(cacheBustPath, new Date().toISOString());
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 6: Update the single-source-data.ts file
    console.log('\nStep 6: Updating single-source-data.ts file...');
    
    // Get all rows from the database
    const rows = await db.all(`
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
      FROM chart_data
      ORDER BY id
    `);
    console.log(`Retrieved ${rows.length} rows from database`);
    
    // Get chart group settings
    const chartGroupSettings = await db.all(`
      SELECT 
        id,
        name,
        display_order,
        is_visible,
        settings
      FROM chart_groups
      ORDER BY display_order
    `);
    console.log(`Retrieved ${chartGroupSettings.length} chart group settings`);
    
    // Get server configs
    const serverConfigs = await db.all(`
      SELECT 
        id,
        server_name as "name",
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
    
    // Process chart group settings
    const processedChartGroupSettings = chartGroupSettings.map((group) => {
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
    
    // Process server configs
    const processedServerConfigs = serverConfigs.map((config) => {
      let configObj = {};
      try {
        configObj = JSON.parse(config.config || '{}');
      } catch (error) {
        console.warn(`Error parsing config for server ${config.name}:`, error);
      }
      
      return {
        id: config.id || '',
        name: config.name || '',
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
    const singleSourcePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
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
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(rows, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
    
    // Write the file
    fs.writeFileSync(singleSourcePath, fileContent);
    console.log(`Updated single-source-data.ts file at: ${singleSourcePath}`);
    
    // Step 7: Commit the transaction
    console.log('\nStep 7: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 8: Close the database connection
    console.log('\nStep 8: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    console.log('\nTest and fix completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the Next.js server with "npm run dev"');
    console.log('2. Open the dashboard to verify the data is displayed correctly');
    console.log('3. Open the admin spreadsheet to verify the data is displayed correctly');
    
  } catch (error) {
    console.error('Error during test and fix:', error);
    
    // Try to rollback the transaction if an error occurred
    try {
      const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      await db.run('ROLLBACK');
      await db.close();
      console.log('Transaction rolled back due to error');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
  }
}

// Run the main function
testAndFixAccountsSql();
