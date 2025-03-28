/**
 * Script to check the database schema and update the single-source-data.ts file directly
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
// Path to the single-source-data.ts file
const singleSourceFilePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');

async function checkAndUpdateSchema() {
  try {
    console.log(`Opening database at: ${dbPath}`);
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Check the schema of the chart_data table
    const tableInfo = await db.all(`PRAGMA table_info(chart_data)`);
    console.log('Chart data table schema:');
    tableInfo.forEach(column => {
      console.log(`- ${column.name} (${column.type})`);
    });
    
    // Get all data from the database
    console.log('\nFetching data from database...');
    
    // Get chart data
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
    `);
    
    console.log(`Found ${chartData.length} chart data items`);
    
    // Get chart group settings
    const chartGroupSettings = await db.all(`
      SELECT 
        id,
        name,
        display_order as "display_order",
        is_visible as "is_visible",
        settings
      FROM chart_groups
    `);
    
    console.log(`Found ${chartGroupSettings.length} chart group settings`);
    
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
    
    console.log(`Found ${serverConfigs.length} server configs`);
    
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
    console.log(`\nUpdated single-source-data.ts file at: ${singleSourceFilePath}`);
    
    // Verify the Accounts SQL expressions
    console.log('\nVerifying Accounts SQL expressions:');
    
    // Check Accounts Payable Feb specifically (as mentioned by the user)
    const accountsPayableFeb = chartData.find(item => item.DataPoint === 'Accounts Payable Feb');
    if (accountsPayableFeb) {
      console.log('\nAccounts Payable Feb:');
      console.log(`ID: ${accountsPayableFeb.id}`);
      console.log(`Table Name: ${accountsPayableFeb.tableName}`);
      console.log(`SQL Expression: ${accountsPayableFeb.productionSqlExpression}`);
      
      if (accountsPayableFeb.productionSqlExpression.includes('SELECT SUM(balance) as value FROM dbo.ap_open_items')) {
        console.log('✅ SQL expression is correct');
      } else {
        console.log('❌ SQL expression is not correct');
      }
    } else {
      console.log('Accounts Payable Feb not found in the data');
    }
    
    // Close the database connection
    await db.close();
    
    console.log('\nCheck and update completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
checkAndUpdateSchema();
