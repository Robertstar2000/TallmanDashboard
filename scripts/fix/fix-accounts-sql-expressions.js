/**
 * Script to fix the Accounts SQL expressions in both the database and the single-source-data.ts file
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to the single-source-data.ts file
const singleSourceFilePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');

// Define the correct SQL expressions for Accounts data
const accountsPayableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsReceivableSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month}`;
const accountsOverdueSql = (month) => `SELECT SUM(balance) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = ${month} AND DATEDIFF(day, due_date, GETDATE()) > 30`;

// Map month names to numbers
const monthMap = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

async function fixAccountsSqlExpressions() {
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
      // Get all Accounts data from the database
      const accountsData = await db.all(`
        SELECT 
          id,
          DataPoint,
          chart_group,
          variable_name,
          server_name,
          table_name,
          calculation,
          sql_expression,
          value,
          last_updated
        FROM chart_data
        WHERE chart_group = 'Accounts'
        ORDER BY id
      `);
      
      console.log(`Found ${accountsData.length} Accounts data items in the database`);
      
      // Update each Accounts data item with the correct SQL expression
      let updatedCount = 0;
      
      for (const item of accountsData) {
        // Extract month from DataPoint (e.g., "Accounts Payable Jan" -> "Jan")
        const parts = item.DataPoint.split(' ');
        const monthName = parts[parts.length - 1];
        const monthNumber = monthMap[monthName];
        
        if (!monthNumber) {
          console.log(`Skipping item ${item.id} (${item.DataPoint}) - invalid month: ${monthName}`);
          continue;
        }
        
        console.log(`Processing item ${item.id} (${item.DataPoint}) - month: ${monthName} (${monthNumber})`);
        
        let newSqlExpression;
        let newTableName;
        
        // Determine which SQL expression to use based on the DataPoint
        if (item.DataPoint.includes('Payable')) {
          newSqlExpression = accountsPayableSql(monthNumber);
          newTableName = 'dbo.ap_open_items';
        } else if (item.DataPoint.includes('Receivable')) {
          newSqlExpression = accountsReceivableSql(monthNumber);
          newTableName = 'dbo.ar_open_items';
        } else if (item.DataPoint.includes('Overdue')) {
          newSqlExpression = accountsOverdueSql(monthNumber);
          newTableName = 'dbo.ar_open_items';
        } else {
          console.log(`Skipping item ${item.id} (${item.DataPoint}) - unknown type`);
          continue;
        }
        
        // Update the database with the new SQL expression
        await db.run(`
          UPDATE chart_data
          SET 
            table_name = ?,
            sql_expression = ?,
            last_updated = ?
          WHERE id = ?
        `, [
          newTableName,
          newSqlExpression,
          new Date().toISOString(),
          item.id
        ]);
        
        updatedCount++;
      }
      
      console.log(`Updated ${updatedCount} Accounts SQL expressions in the database`);
      
      // Commit all changes
      await db.run('COMMIT');
      console.log('Successfully committed all changes to database');
      
      // Verify the updates in the database
      console.log('\nVerifying database updates...');
      
      // Check Accounts Payable Feb specifically (as mentioned by the user)
      const accountsPayableFeb = await db.get('SELECT * FROM chart_data WHERE DataPoint = ?', 'Accounts Payable Feb');
      if (accountsPayableFeb) {
        console.log('\nAccounts Payable Feb in database:');
        console.log(`ID: ${accountsPayableFeb.id}`);
        console.log(`Table Name: ${accountsPayableFeb.table_name}`);
        console.log(`SQL Expression: ${accountsPayableFeb.sql_expression}`);
        
        if (accountsPayableFeb.sql_expression === accountsPayableSql(2)) {
          console.log('✅ SQL expression updated successfully in database');
        } else {
          console.log('❌ SQL expression not updated correctly in database');
        }
      } else {
        console.log('Accounts Payable Feb not found in the database');
      }
      
      // Now update the single-source-data.ts file
      console.log('\nUpdating single-source-data.ts file...');
      
      // Get all data from the database for the single-source-data.ts file
      const allChartData = await db.all(`
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
      `);
      
      // Get chart group settings
      const chartGroupSettings = await db.all(`
        SELECT 
          id,
          name,
          display_order,
          is_visible,
          settings
        FROM chart_groups
      `);
      
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
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(allChartData, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
      
      // Write the file
      fs.writeFileSync(singleSourceFilePath, fileContent);
      console.log(`Updated single-source-data.ts file at: ${singleSourceFilePath}`);
      
      // Verify the Accounts SQL expressions in the file
      console.log('\nVerifying single-source-data.ts file updates...');
      
      // Read the file to verify
      const fileContentAfterUpdate = fs.readFileSync(singleSourceFilePath, 'utf8');
      
      // Check if the file contains the correct SQL expression for Accounts Payable Feb
      if (fileContentAfterUpdate.includes(accountsPayableSql(2))) {
        console.log('✅ SQL expression for Accounts Payable Feb updated successfully in single-source-data.ts file');
      } else {
        console.log('❌ SQL expression for Accounts Payable Feb not updated correctly in single-source-data.ts file');
      }
      
      // Close the database connection
      await db.close();
      
      console.log('\nFix completed successfully');
      
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      console.error('Error during fix, rolled back changes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
fixAccountsSqlExpressions();

