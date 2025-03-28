/**
 * Script to update the single-source-data.ts file from the database
 * to ensure they are in sync
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to the single-source-data.ts file
const singleSourceFilePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');

async function updateSingleSourceFromDb() {
  try {
    console.log(`Opening database at: ${dbPath}`);
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
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
    
    // Verify the Accounts SQL expressions in the file
    console.log('\nVerifying single-source-data.ts file updates...');
    
    // Read the file to verify
    const fileContentAfterUpdate = fs.readFileSync(singleSourceFilePath, 'utf8');
    
    // Check if the file contains the correct SQL expression for Accounts Payable Feb
    const accountsPayableFebSql = "SELECT SUM(balance) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 2";
    if (fileContentAfterUpdate.includes(accountsPayableFebSql)) {
      console.log('✅ SQL expression for Accounts Payable Feb updated successfully in single-source-data.ts file');
    } else {
      console.log('❌ SQL expression for Accounts Payable Feb not updated correctly in single-source-data.ts file');
      console.log('Expected:', accountsPayableFebSql);
    }
    
    // Close the database connection
    await db.close();
    
    console.log('\nUpdate completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
updateSingleSourceFromDb();
