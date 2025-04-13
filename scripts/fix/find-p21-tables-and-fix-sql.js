/**
 * FIND P21 TABLES AND FIX SQL
 * 
 * This script:
 * 1. Lists all tables in the P21 database to find the correct ones for accounts data
 * 2. Tests SQL expressions against those actual tables
 * 3. Updates the database with only working, tested SQL expressions (no fallbacks)
 * 4. Updates the references to use the single source of truth
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
// Path to the complete-chart-data.ts file that should be replaced
const completeChartDataPath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');
// Path to the test-all-por-sql page that references the complete-chart-data.ts file
const testAllPorSqlPath = path.join(process.cwd(), 'app', 'TestScripts', 'test-all-por-sql', 'page.tsx');

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
async function findP21TablesAndFixSql() {
  console.log('FIND P21 TABLES AND FIX SQL');
  console.log('==========================');
  
  try {
    // Step 1: List all tables in the P21 database
    console.log('\nStep 1: Listing all tables in the P21 database...');
    
    const tableQuery = `
      SELECT 
        t.name AS table_name,
        s.name AS schema_name
      FROM 
        sys.tables t
      INNER JOIN 
        sys.schemas s ON t.schema_id = s.schema_id
      ORDER BY 
        s.name, t.name
    `;
    
    let tables = [];
    try {
      tables = await executeP21Query(tableQuery);
      console.log(`Found ${tables.length} tables in the P21 database`);
      
      // Display the first 20 tables
      console.log('\nSample of tables:');
      tables.slice(0, 20).forEach(table => {
        console.log(`${table.schema_name}.${table.table_name}`);
      });
    } catch (error) {
      console.error('Error listing tables:', error);
      console.log('Continuing with default table names...');
    }
    
    // Step 2: Find tables related to accounts payable and receivable
    console.log('\nStep 2: Finding tables related to accounts payable and receivable...');
    
    // Define search terms for accounts payable and receivable
    const searchTerms = ['ap', 'ar', 'account', 'payable', 'receivable', 'invoice'];
    
    // Filter tables by search terms
    const accountsTables = tables.filter(table => {
      const tableName = table.table_name.toLowerCase();
      return searchTerms.some(term => tableName.includes(term));
    });
    
    console.log(`\nFound ${accountsTables.length} tables related to accounts`);
    console.log('\nAccounts-related tables:');
    accountsTables.forEach(table => {
      console.log(`${table.schema_name}.${table.table_name}`);
    });
    
    // Step 3: Get columns for the accounts tables
    console.log('\nStep 3: Getting columns for the accounts tables...');
    
    const tableColumns = {};
    
    for (const table of accountsTables) {
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
        tableColumns[tableName] = columns;
        
        console.log(`\nColumns for ${tableName}:`);
        columns.forEach(column => {
          console.log(`${column.column_name} (${column.data_type})`);
        });
      } catch (error) {
        console.error(`Error getting columns for ${tableName}:`, error);
      }
    }
    
    // Step 4: Generate and test SQL expressions for accounts data
    console.log('\nStep 4: Generating and testing SQL expressions for accounts data...');
    
    // Define test SQL expressions based on discovered tables and columns
    const testExpressions = [];
    
    // Add test expressions for each accounts table
    for (const table of accountsTables) {
      const tableName = `${table.schema_name}.${table.table_name}`;
      const columns = tableColumns[tableName] || [];
      
      // Look for amount/balance columns
      const amountColumns = columns.filter(column => {
        const columnName = column.column_name.toLowerCase();
        return columnName.includes('amount') || 
               columnName.includes('balance') || 
               columnName.includes('total') ||
               columnName.includes('sum') ||
               columnName.includes('value');
      });
      
      // Look for date columns
      const dateColumns = columns.filter(column => {
        const columnName = column.column_name.toLowerCase();
        return columnName.includes('date') && column.data_type.includes('date');
      });
      
      // Generate test expressions if we have both amount and date columns
      if (amountColumns.length > 0 && dateColumns.length > 0) {
        for (const amountColumn of amountColumns) {
          for (const dateColumn of dateColumns) {
            // Generate SQL for accounts payable
            if (tableName.toLowerCase().includes('ap') || tableName.toLowerCase().includes('payable')) {
              testExpressions.push({
                name: `Accounts Payable (${tableName}.${amountColumn.column_name})`,
                type: 'Payable',
                sql: `SELECT SUM(${amountColumn.column_name}) as value FROM ${tableName} WITH (NOLOCK) WHERE MONTH(${dateColumn.column_name}) = 1 AND YEAR(${dateColumn.column_name}) = YEAR(GETDATE())`
              });
            }
            
            // Generate SQL for accounts receivable
            if (tableName.toLowerCase().includes('ar') || tableName.toLowerCase().includes('receivable')) {
              testExpressions.push({
                name: `Accounts Receivable (${tableName}.${amountColumn.column_name})`,
                type: 'Receivable',
                sql: `SELECT SUM(${amountColumn.column_name}) as value FROM ${tableName} WITH (NOLOCK) WHERE MONTH(${dateColumn.column_name}) = 1 AND YEAR(${dateColumn.column_name}) = YEAR(GETDATE())`
              });
              
              // Generate SQL for accounts overdue (if we can find a due date column)
              const dueDateColumns = columns.filter(column => {
                const columnName = column.column_name.toLowerCase();
                return columnName.includes('due') && column.data_type.includes('date');
              });
              
              if (dueDateColumns.length > 0) {
                for (const dueDateColumn of dueDateColumns) {
                  testExpressions.push({
                    name: `Accounts Overdue (${tableName}.${amountColumn.column_name})`,
                    type: 'Overdue',
                    sql: `SELECT SUM(${amountColumn.column_name}) as value FROM ${tableName} WITH (NOLOCK) WHERE MONTH(${dateColumn.column_name}) = 1 AND YEAR(${dateColumn.column_name}) = YEAR(GETDATE()) AND DATEDIFF(day, ${dueDateColumn.column_name}, GETDATE()) > 30`
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Add some common SQL expressions that might work
    testExpressions.push({
      name: 'Accounts Payable (dbo.ap_invoices.invoice_amt)',
      type: 'Payable',
      sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ap_invoices WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
    });
    
    testExpressions.push({
      name: 'Accounts Receivable (dbo.ar_invoices.invoice_amt)',
      type: 'Receivable',
      sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ar_invoices WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
    });
    
    testExpressions.push({
      name: 'Accounts Overdue (dbo.ar_invoices.invoice_amt)',
      type: 'Overdue',
      sql: 'SELECT SUM(invoice_amt) as value FROM dbo.ar_invoices WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE()) AND DATEDIFF(day, due_date, GETDATE()) > 30'
    });
    
    console.log(`\nGenerated ${testExpressions.length} test SQL expressions`);
    
    // Test each SQL expression
    console.log('\nTesting SQL expressions...');
    
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
    
    // Group successful expressions by type
    const payableExpressions = successfulExpressions.filter(result => result.type === 'Payable');
    const receivableExpressions = successfulExpressions.filter(result => result.type === 'Receivable');
    const overdueExpressions = successfulExpressions.filter(result => result.type === 'Overdue');
    
    console.log(`\nSuccessful Payable expressions: ${payableExpressions.length}`);
    console.log(`Successful Receivable expressions: ${receivableExpressions.length}`);
    console.log(`Successful Overdue expressions: ${overdueExpressions.length}`);
    
    // Step 6: Update the database with the working SQL expressions
    console.log('\nStep 6: Updating the database with the working SQL expressions...');
    
    // Only proceed if we have at least one successful expression for each type
    if (payableExpressions.length === 0 && receivableExpressions.length === 0 && overdueExpressions.length === 0) {
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
      let expressionFound = false;
      
      // Determine which SQL expression to use based on the type
      if (item.type === 'Payable' && payableExpressions.length > 0) {
        // Use the first successful payable expression
        const bestExpression = payableExpressions[0];
        
        // Extract the table name from the SQL expression
        const tableNameMatch = bestExpression.sql.match(/FROM\s+([^\s]+)/i);
        tableName = tableNameMatch ? tableNameMatch[1] : '';
        
        // Replace the month in the SQL expression
        sqlExpression = bestExpression.sql.replace(/MONTH\([^)]+\)\s*=\s*\d+/i, `MONTH(${bestExpression.sql.match(/MONTH\(([^)]+)\)/i)[1]}) = ${item.month}`);
        expressionFound = true;
      } else if (item.type === 'Receivable' && receivableExpressions.length > 0) {
        // Use the first successful receivable expression
        const bestExpression = receivableExpressions[0];
        
        // Extract the table name from the SQL expression
        const tableNameMatch = bestExpression.sql.match(/FROM\s+([^\s]+)/i);
        tableName = tableNameMatch ? tableNameMatch[1] : '';
        
        // Replace the month in the SQL expression
        sqlExpression = bestExpression.sql.replace(/MONTH\([^)]+\)\s*=\s*\d+/i, `MONTH(${bestExpression.sql.match(/MONTH\(([^)]+)\)/i)[1]}) = ${item.month}`);
        expressionFound = true;
      } else if (item.type === 'Overdue' && overdueExpressions.length > 0) {
        // Use the first successful overdue expression
        const bestExpression = overdueExpressions[0];
        
        // Extract the table name from the SQL expression
        const tableNameMatch = bestExpression.sql.match(/FROM\s+([^\s]+)/i);
        tableName = tableNameMatch ? tableNameMatch[1] : '';
        
        // Replace the month in the SQL expression
        sqlExpression = bestExpression.sql.replace(/MONTH\([^)]+\)\s*=\s*\d+/i, `MONTH(${bestExpression.sql.match(/MONTH\(([^)]+)\)/i)[1]}) = ${item.month}`);
        expressionFound = true;
      }
      
      if (!expressionFound) {
        console.log(`No successful expression found for ${item.name}, skipping`);
        continue;
      }
      
      // Update the database with the working SQL expression
      await db.run(`
        UPDATE chart_data
        SET 
          table_name = ?,
          sql_expression = ?,
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
        sql_expression as "sqlExpression",
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
    
    // Step 8: Update the reference to complete-chart-data.ts
    console.log('\nStep 8: Updating reference to complete-chart-data.ts...');
    
    if (fs.existsSync(testAllPorSqlPath)) {
      // Read the file
      const testAllPorSqlContent = fs.readFileSync(testAllPorSqlPath, 'utf8');
      
      // Replace the import statement
      const updatedContent = testAllPorSqlContent.replace(
        /import\s*{\s*initialSpreadsheetData\s*}\s*from\s*['"]\.\.\/\.\.\/\.\.\/lib\/db\/complete-chart-data['"];?/,
        `import { dashboardData as initialSpreadsheetData } from '../../../lib/db/single-source-data';`
      );
      
      // Write the updated file
      fs.writeFileSync(testAllPorSqlPath, updatedContent);
      console.log(`Updated reference in ${testAllPorSqlPath}`);
    } else {
      console.log(`File ${testAllPorSqlPath} not found, skipping update`);
    }
    
    // Step 9: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 9: Creating cache-busting file...');
    fs.writeFileSync(cacheBustPath, new Date().toISOString());
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 10: Commit the transaction
    console.log('\nStep 10: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 11: Close the database connection
    console.log('\nStep 11: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    console.log('\nFind P21 tables and fix SQL completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the Next.js server with "npm run dev"');
    console.log('2. Open the dashboard to verify the data is displayed correctly');
    console.log('3. Open the admin spreadsheet to verify the data is displayed correctly');
    
  } catch (error) {
    console.error('Error during find P21 tables and fix SQL:', error);
    
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
findP21TablesAndFixSql();

