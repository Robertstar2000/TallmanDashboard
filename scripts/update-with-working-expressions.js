/**
 * UPDATE WITH WORKING EXPRESSIONS
 * 
 * This script updates the database with the working SQL expressions
 * that have been tested and confirmed to return actual data.
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to the single-source-data.ts file
const singleSourcePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
// Path to create a cache-busting file
const cacheBustPath = path.join(process.cwd(), 'data', 'cache-bust.txt');
// Path to Next.js cache directory
const nextCachePath = path.join(process.cwd(), '.next', 'cache');

// Define the working SQL expressions for Accounts data
// These are the expressions that have been tested and confirmed to work
const accountsPayableSql = (month) => `
SELECT SUM(open_balance) as value 
FROM dbo.ap_hdr WITH (NOLOCK) 
WHERE MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = YEAR(GETDATE())`;

const accountsReceivableSql = (month) => `
SELECT SUM(open_balance) as value 
FROM dbo.ar_hdr WITH (NOLOCK) 
WHERE MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = YEAR(GETDATE())`;

const accountsOverdueSql = (month) => `
SELECT SUM(open_balance) as value 
FROM dbo.ar_hdr WITH (NOLOCK) 
WHERE MONTH(invoice_date) = ${month} AND YEAR(invoice_date) = YEAR(GETDATE())
AND DATEDIFF(day, due_date, GETDATE()) > 30`;

// Main function
async function updateWithWorkingExpressions() {
  console.log('UPDATE WITH WORKING EXPRESSIONS');
  console.log('==============================');
  console.log(`Database path: ${dbPath}`);
  console.log(`Single source path: ${singleSourcePath}`);
  
  try {
    // Step 1: Connect to the database
    console.log('\nStep 1: Connecting to database...');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('Database connection successful');
    
    // Step 2: Begin transaction
    console.log('\nStep 2: Beginning transaction...');
    await db.run('BEGIN TRANSACTION');
    
    // Step 3: Update the SQL expressions for Accounts data
    console.log('\nStep 3: Updating SQL expressions for Accounts data...');
    
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
    
    // Update each Accounts data item with the working SQL expression
    let updatedCount = 0;
    
    for (const item of accountsData) {
      console.log(`Processing item ${item.id} (${item.name}) - month: ${item.month}`);
      
      let sqlExpression;
      let tableName;
      
      // Determine which SQL expression to use based on the type
      if (item.type === 'Payable') {
        sqlExpression = accountsPayableSql(item.month);
        tableName = 'dbo.ap_hdr';
      } else if (item.type === 'Receivable') {
        sqlExpression = accountsReceivableSql(item.month);
        tableName = 'dbo.ar_hdr';
      } else if (item.type === 'Overdue') {
        sqlExpression = accountsOverdueSql(item.month);
        tableName = 'dbo.ar_hdr';
      } else {
        console.log(`Skipping item ${item.id} (${item.name}) - unknown type`);
        continue;
      }
      
      // Get the current value from the database
      const currentRow = await db.get('SELECT * FROM chart_data WHERE id = ?', item.id);
      const currentValue = currentRow ? currentRow.value : '0';
      
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
    
    console.log(`Updated ${updatedCount} Accounts SQL expressions in the database with working expressions`);
    
    // Step 4: Get all rows from the database
    console.log('\nStep 4: Retrieving all rows from database...');
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
    
    // Step 5: Get chart group settings
    console.log('\nStep 5: Retrieving chart group settings...');
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
    
    // Step 6: Get server configs
    console.log('\nStep 6: Retrieving server configs...');
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
    
    // Step 7: Process chart group settings
    console.log('\nStep 7: Processing chart group settings...');
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
    
    // Step 8: Process server configs
    console.log('\nStep 8: Processing server configs...');
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
    
    // Step 9: Update the single-source-data.ts file
    console.log('\nStep 9: Updating single-source-data.ts file...');
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
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(rows, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
    
    // Write the file
    fs.writeFileSync(singleSourcePath, fileContent);
    console.log(`Updated single-source-data.ts file`);
    
    // Step 10: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 10: Creating cache-busting file...');
    fs.writeFileSync(cacheBustPath, timestamp);
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 11: Clear the Next.js cache
    console.log('\nStep 11: Clearing Next.js cache...');
    if (fs.existsSync(nextCachePath)) {
      try {
        // Delete cache files recursively
        const deleteFolderRecursive = function(folderPath) {
          if (fs.existsSync(folderPath)) {
            fs.readdirSync(folderPath).forEach((file) => {
              const curPath = path.join(folderPath, file);
              if (fs.lstatSync(curPath).isDirectory()) {
                // Recursive call for directories
                deleteFolderRecursive(curPath);
              } else {
                // Delete file
                try {
                  fs.unlinkSync(curPath);
                  console.log(`Deleted cache file: ${curPath}`);
                } catch (e) {
                  console.error(`Error deleting cache file ${curPath}:`, e);
                }
              }
            });
          }
        };
        
        // Delete cache files but keep the directory structure
        fs.readdirSync(nextCachePath).forEach((dir) => {
          const dirPath = path.join(nextCachePath, dir);
          if (fs.lstatSync(dirPath).isDirectory()) {
            fs.readdirSync(dirPath).forEach((file) => {
              const filePath = path.join(dirPath, file);
              if (fs.lstatSync(filePath).isFile()) {
                try {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted cache file: ${filePath}`);
                } catch (e) {
                  console.error(`Error deleting cache file ${filePath}:`, e);
                }
              }
            });
          }
        });
        
        console.log('Next.js cache cleared successfully');
      } catch (cacheError) {
        console.error('Error clearing Next.js cache:', cacheError);
      }
    } else {
      console.log('Next.js cache directory not found, skipping cache clear');
    }
    
    // Step 12: Commit the transaction
    console.log('\nStep 12: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 13: Close the database connection
    console.log('\nStep 13: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    // Step 14: Verify the update
    console.log('\nStep 14: Verifying update...');
    // Check if the single-source-data.ts file exists and has the expected content
    if (fs.existsSync(singleSourcePath)) {
      const stats = fs.statSync(singleSourcePath);
      console.log(`single-source-data.ts file exists with size: ${stats.size} bytes`);
      
      // Check if the cache-busting file exists
      if (fs.existsSync(cacheBustPath)) {
        console.log(`Cache-busting file exists`);
      } else {
        console.error(`Cache-busting file was not created successfully`);
      }
    } else {
      console.error(`single-source-data.ts file was not created successfully`);
    }
    
    console.log('\nUpdate with working expressions completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Kill the current Next.js server process');
    console.log('2. Restart the Next.js server with "npm run dev"');
    console.log('3. Open the dashboard to verify the data is displayed correctly');
    console.log('4. Open the admin spreadsheet to verify the data is displayed correctly');
    
  } catch (error) {
    console.error('Error during update with working expressions:', error);
    
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
updateWithWorkingExpressions();
