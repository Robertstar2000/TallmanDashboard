/**
 * FIND ACCOUNTS PAYABLE TABLES
 * 
 * This script focuses specifically on finding tables and columns
 * related to Accounts Payable and testing SQL expressions against them.
 */

const odbc = require('odbc');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

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
      console.log('Query executed successfully');
      
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
async function findAccountsPayableTables() {
  console.log('FIND ACCOUNTS PAYABLE TABLES');
  console.log('===========================');
  
  try {
    // Step 1: Find tables with "AP" in the name
    console.log('\nStep 1: Finding tables with "AP" in the name...');
    
    const apTablesQuery = `
      SELECT 
        t.name AS table_name,
        s.name AS schema_name
      FROM 
        sys.tables t
      INNER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id
      WHERE 
        t.name LIKE '%ap%' OR 
        t.name LIKE '%payable%'
      ORDER BY 
        t.name
    `;
    
    const apTables = await executeP21Query(apTablesQuery);
    console.log(`Found ${apTables.length} tables with "AP" or "payable" in the name`);
    
    console.log('\nAP Tables:');
    apTables.forEach(table => {
      console.log(`${table.schema_name}.${table.table_name}`);
    });
    
    // Step 2: Find columns in these tables
    console.log('\nStep 2: Finding columns in AP tables...');
    
    const apTableColumns = {};
    
    for (const table of apTables) {
      const tableName = `${table.schema_name}.${table.table_name}`;
      
      try {
        const columnsQuery = `
          SELECT 
            c.name AS column_name,
            t.name AS data_type
          FROM 
            sys.columns c
          INNER JOIN 
            sys.types t ON c.user_type_id = t.user_type_id
          WHERE 
            c.object_id = OBJECT_ID('${tableName}')
          ORDER BY 
            c.column_id
        `;
        
        const columns = await executeP21Query(columnsQuery);
        apTableColumns[tableName] = columns;
        
        console.log(`\nColumns for ${tableName}:`);
        columns.forEach(column => {
          console.log(`${column.column_name} (${column.data_type})`);
        });
      } catch (error) {
        console.error(`Error getting columns for ${tableName}:`, error);
      }
    }
    
    // Step 3: Generate test SQL expressions for AP tables
    console.log('\nStep 3: Generating test SQL expressions for AP tables...');
    
    const testExpressions = [];
    
    for (const table of apTables) {
      const tableName = `${table.schema_name}.${table.table_name}`;
      const columns = apTableColumns[tableName] || [];
      
      // Look for amount/balance columns (numeric types only)
      const amountColumns = columns.filter(column => {
        const columnName = column.column_name.toLowerCase();
        const isNumeric = ['money', 'decimal', 'numeric', 'float', 'real', 'int', 'bigint', 'smallint', 'tinyint'].includes(column.data_type.toLowerCase());
        
        return isNumeric && (
          columnName.includes('amount') || 
          columnName.includes('amt') ||
          columnName.includes('balance') || 
          columnName.includes('total') ||
          columnName.includes('sum') ||
          columnName.includes('value')
        );
      });
      
      // Look for date columns
      const dateColumns = columns.filter(column => {
        const columnName = column.column_name.toLowerCase();
        const isDate = ['date', 'datetime', 'smalldatetime', 'datetime2'].includes(column.data_type.toLowerCase());
        
        return isDate && columnName.includes('date');
      });
      
      // Generate test expressions if we have both amount and date columns
      if (amountColumns.length > 0 && dateColumns.length > 0) {
        for (const amountColumn of amountColumns) {
          for (const dateColumn of dateColumns) {
            testExpressions.push({
              name: `Accounts Payable (${tableName}.${amountColumn.column_name})`,
              type: 'Payable',
              sql: `SELECT SUM(${amountColumn.column_name}) as value FROM ${tableName} WITH (NOLOCK) WHERE MONTH(${dateColumn.column_name}) = 1 AND YEAR(${dateColumn.column_name}) = YEAR(GETDATE())`
            });
          }
        }
      }
    }
    
    // Add some specific test expressions for common AP tables
    const specificExpressions = [
      {
        name: 'Accounts Payable (dbo.ap_invoice.invoice_amt)',
        type: 'Payable',
        sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ap_invoice WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
      },
      {
        name: 'Accounts Payable (dbo.ap_invoice.balance)',
        type: 'Payable',
        sql: 'SELECT SUM(balance) as value FROM dbo.ap_invoice WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
      },
      {
        name: 'Accounts Payable (dbo.ap_invoice.open_balance)',
        type: 'Payable',
        sql: 'SELECT SUM(open_balance) as value FROM dbo.ap_invoice WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
      },
      {
        name: 'Accounts Payable (dbo.apinv_hdr.invoice_amt)',
        type: 'Payable',
        sql: 'SELECT SUM(invoice_amt) as value FROM dbo.apinv_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
      },
      {
        name: 'Accounts Payable (dbo.apinv_hdr.balance)',
        type: 'Payable',
        sql: 'SELECT SUM(balance) as value FROM dbo.apinv_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
      },
      {
        name: 'Accounts Payable (dbo.apinv_hdr.open_balance)',
        type: 'Payable',
        sql: 'SELECT SUM(open_balance) as value FROM dbo.apinv_hdr WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
      }
    ];
    
    // Combine all test expressions
    testExpressions.push(...specificExpressions);
    
    console.log(`\nGenerated ${testExpressions.length} test SQL expressions for AP tables`);
    
    // Step 4: Test each SQL expression
    console.log('\nStep 4: Testing SQL expressions...');
    
    const testResults = [];
    
    for (const expression of testExpressions) {
      console.log(`\nTesting: ${expression.name}`);
      console.log(`SQL: ${expression.sql}`);
      
      try {
        const result = await executeP21Query(expression.sql);
        
        if (result && result.length > 0) {
          const value = result[0].value;
          console.log(`Result: ${value}`);
          
          testResults.push({
            name: expression.name,
            type: expression.type,
            sql: expression.sql,
            success: true,
            value: value
          });
        } else {
          console.log('No results returned');
          
          testResults.push({
            name: expression.name,
            type: expression.type,
            sql: expression.sql,
            success: false,
            value: null
          });
        }
      } catch (error) {
        console.error(`Error executing query: ${error.message}`);
        
        testResults.push({
          name: expression.name,
          type: expression.type,
          sql: expression.sql,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 5: Analyze the test results
    console.log('\nStep 5: Analyzing test results...');
    
    const successfulExpressions = testResults.filter(result => result.success && result.value !== null && result.value > 0);
    console.log(`\nSuccessful expressions (${successfulExpressions.length}):`);
    successfulExpressions.forEach(result => {
      console.log(`\n${result.name}`);
      console.log(`SQL: ${result.sql}`);
      console.log(`Value: ${result.value}`);
    });
    
    // Step 6: Update the database with the working SQL expressions
    console.log('\nStep 6: Updating the database with the working SQL expressions...');
    
    // Only proceed if we have at least one successful expression
    if (successfulExpressions.length === 0) {
      console.log('\nNo successful expressions found. Cannot update the database.');
      return;
    }
    
    // Connect to the database
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connection successful');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Define the accounts payable data to update
    const accountsPayableData = [
      { id: '6', name: 'Accounts Payable Jan', month: 1 },
      { id: '7', name: 'Accounts Payable Feb', month: 2 },
      { id: '8', name: 'Accounts Payable Mar', month: 3 },
      { id: '9', name: 'Accounts Payable Apr', month: 4 },
      { id: '10', name: 'Accounts Payable May', month: 5 },
      { id: '11', name: 'Accounts Payable Jun', month: 6 },
      { id: '12', name: 'Accounts Payable Jul', month: 7 },
      { id: '13', name: 'Accounts Payable Aug', month: 8 },
      { id: '14', name: 'Accounts Payable Sep', month: 9 },
      { id: '15', name: 'Accounts Payable Oct', month: 10 },
      { id: '16', name: 'Accounts Payable Nov', month: 11 },
      { id: '17', name: 'Accounts Payable Dec', month: 12 }
    ];
    
    // Use the best expression (first successful one)
    const bestExpression = successfulExpressions[0];
    
    // Extract the table name from the SQL expression
    const tableNameMatch = bestExpression.sql.match(/FROM\s+([^\s]+)/i);
    const tableName = tableNameMatch ? tableNameMatch[1] : '';
    
    // Update each Accounts Payable data item with the best SQL expression
    let updatedCount = 0;
    
    for (const item of accountsPayableData) {
      console.log(`Processing item ${item.id} (${item.name}) - month: ${item.month}`);
      
      // Replace the month in the SQL expression
      const dateColumnMatch = bestExpression.sql.match(/MONTH\(([^)]+)\)/i);
      const dateColumn = dateColumnMatch ? dateColumnMatch[1] : 'invoice_date';
      
      const sqlExpression = bestExpression.sql.replace(
        /MONTH\([^)]+\)\s*=\s*\d+/i, 
        `MONTH(${dateColumn}) = ${item.month}`
      );
      
      // Update the database with the working SQL expression
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
    
    console.log(`Updated ${updatedCount} Accounts Payable SQL expressions in the database with working expressions`);
    
    // Step 7: Update the single-source-data.ts file
    console.log('\nStep 7: Updating single-source-data.ts file...');
    
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
    
    // Step 8: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 8: Creating cache-busting file...');
    const cacheBustPath = path.join(process.cwd(), 'data', 'cache-bust.txt');
    fs.writeFileSync(cacheBustPath, new Date().toISOString());
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 9: Commit the transaction
    console.log('\nStep 9: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 10: Close the database connection
    console.log('\nStep 10: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    console.log('\nFind Accounts Payable Tables completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the Next.js server with "npm run dev"');
    console.log('2. Open the dashboard to verify the data is displayed correctly');
    console.log('3. Open the admin spreadsheet to verify the data is displayed correctly');
    
  } catch (error) {
    console.error('Error during find accounts payable tables:', error);
    
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
findAccountsPayableTables();
