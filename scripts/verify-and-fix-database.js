/**
 * Script to verify and fix the database schema and data
 * This script will:
 * 1. Check the database schema
 * 2. Ensure all Accounts SQL expressions are correct
 * 3. Clear the cache to force a refresh of the data
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Define the correct SQL expressions for Accounts data
const accountsPayableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsReceivableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsOverdueSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND DATEDIFF(day, due_date, GETDATE()) > 30`;

async function verifyAndFixDatabase() {
  try {
    console.log(`Opening database at: ${dbPath}`);
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Check the database schema
      console.log('\nChecking database schema...');
      const tableInfo = await db.all(`PRAGMA table_info(chart_data)`);
      const columns = tableInfo.map(col => col.name);
      console.log('Chart data table columns:', columns);
      
      // Check for any missing columns that might be expected by the application
      const expectedColumns = [
        'id', 'DataPoint', 'chart_group', 'chart_name', 'variable_name', 
        'server_name', 'table_name', 'calculation', 'production_sql_expression', 
        'value', 'last_updated'
      ];
      
      const missingColumns = expectedColumns.filter(col => !columns.includes(col));
      if (missingColumns.length > 0) {
        console.error(`Missing expected columns: ${missingColumns.join(', ')}`);
        // We could add code here to add missing columns if needed
      } else {
        console.log('All expected columns are present in the chart_data table');
      }
      
      // 2. Ensure all Accounts SQL expressions are correct
      console.log('\nUpdating Accounts SQL expressions...');
      
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
      
      // Update each Accounts data item with the correct SQL expression
      let updatedCount = 0;
      
      for (const item of accountsData) {
        console.log(`Processing item ${item.id} (${item.name}) - month: ${item.month}`);
        
        let sqlExpression;
        let tableName;
        
        // Determine which SQL expression to use based on the type
        if (item.type === 'Payable') {
          sqlExpression = accountsPayableSql(item.month);
          tableName = 'dbo.ap_open_items';
        } else if (item.type === 'Receivable') {
          sqlExpression = accountsReceivableSql(item.month);
          tableName = 'dbo.ar_open_items';
        } else if (item.type === 'Overdue') {
          sqlExpression = accountsOverdueSql(item.month);
          tableName = 'dbo.ar_open_items';
        } else {
          console.log(`Skipping item ${item.id} (${item.name}) - unknown type`);
          continue;
        }
        
        // Check if the item exists in the database
        const existingItem = await db.get('SELECT * FROM chart_data WHERE id = ?', item.id);
        if (!existingItem) {
          console.log(`Item ${item.id} (${item.name}) not found in the database, skipping`);
          continue;
        }
        
        // Check if the SQL expression is already correct
        if (existingItem.production_sql_expression === sqlExpression && existingItem.table_name === tableName) {
          console.log(`Item ${item.id} (${item.name}) already has the correct SQL expression, skipping`);
          continue;
        }
        
        // Update the database with the new SQL expression
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
      
      console.log(`Updated ${updatedCount} Accounts SQL expressions in the database`);
      
      // 3. Clear the cache file if it exists
      const cacheDir = path.join(process.cwd(), '.next', 'cache');
      if (fs.existsSync(cacheDir)) {
        console.log('\nClearing Next.js cache...');
        try {
          // This is a simple approach - in a production app you might want to be more selective
          const files = fs.readdirSync(cacheDir);
          for (const file of files) {
            const filePath = path.join(cacheDir, file);
            if (fs.statSync(filePath).isDirectory()) {
              const subFiles = fs.readdirSync(filePath);
              for (const subFile of subFiles) {
                const subFilePath = path.join(filePath, subFile);
                fs.unlinkSync(subFilePath);
                console.log(`Deleted cache file: ${subFilePath}`);
              }
            } else {
              fs.unlinkSync(filePath);
              console.log(`Deleted cache file: ${filePath}`);
            }
          }
          console.log('Cache cleared successfully');
        } catch (cacheError) {
          console.error('Error clearing cache:', cacheError);
        }
      }
      
      // 4. Update the single-source-data.ts file
      console.log('\nUpdating single-source-data.ts file...');
      
      // Get all data from the database for the single-source-data.ts file
      const chartData = await db.all(`
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
      
      console.log(`Found ${chartData.length} chart data items in the database`);
      
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
      
      console.log(`Found ${chartGroupSettings.length} chart group settings in the database`);
      
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
      
      console.log(`Found ${serverConfigs.length} server configs in the database`);
      
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
      const singleSourceFilePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
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
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(chartData, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
      
      // Write the file
      fs.writeFileSync(singleSourceFilePath, fileContent);
      console.log(`Updated single-source-data.ts file at: ${singleSourceFilePath}`);
      
      // 5. Verify the Accounts SQL expressions in the database
      console.log('\nVerifying database updates...');
      
      // Check Accounts Payable Feb specifically (as mentioned by the user)
      const accountsPayableFeb = await db.get('SELECT * FROM chart_data WHERE id = ?', '7');
      if (accountsPayableFeb) {
        console.log('\nAccounts Payable Feb in database:');
        console.log(`ID: ${accountsPayableFeb.id}`);
        console.log(`Table Name: ${accountsPayableFeb.table_name}`);
        console.log(`SQL Expression: ${accountsPayableFeb.production_sql_expression}`);
        
        if (accountsPayableFeb.production_sql_expression === accountsPayableSql(2)) {
          console.log('✅ SQL expression updated successfully in database');
        } else {
          console.log('❌ SQL expression not updated correctly in database');
          console.log('Expected:', accountsPayableSql(2));
          console.log('Actual:', accountsPayableFeb.production_sql_expression);
        }
      } else {
        console.log('Accounts Payable Feb not found in the database');
      }
      
      // Commit all changes
      await db.run('COMMIT');
      console.log('Successfully committed all changes to database');
      
      // Close the database connection
      await db.close();
      
      console.log('\nVerify and fix completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      console.error('Error during verify and fix, rolled back changes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
verifyAndFixDatabase();
