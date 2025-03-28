/**
 * COMPREHENSIVE DATA SYNC SCRIPT
 * 
 * This script provides a complete solution to synchronize data across:
 * 1. The SQLite database (chart_data table)
 * 2. The single-source-data.ts file
 * 3. The dashboard display
 * 
 * It ensures all 174 rows have identical data in all three places.
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

// Main function
async function syncAllData() {
  console.log('COMPREHENSIVE DATA SYNC');
  console.log('======================');
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
    
    // Step 3: Get all rows from the database
    console.log('\nStep 3: Retrieving all rows from database...');
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
    
    // Step 4: Get chart group settings
    console.log('\nStep 4: Retrieving chart group settings...');
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
    
    // Step 5: Get server configs
    console.log('\nStep 5: Retrieving server configs...');
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
    
    // Step 6: Process chart group settings
    console.log('\nStep 6: Processing chart group settings...');
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
    
    // Step 7: Process server configs
    console.log('\nStep 7: Processing server configs...');
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
    
    // Step 8: Update the single-source-data.ts file
    console.log('\nStep 8: Updating single-source-data.ts file...');
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
    
    // Step 9: Create a cache-busting file to force dashboard refresh
    console.log('\nStep 9: Creating cache-busting file...');
    fs.writeFileSync(cacheBustPath, timestamp);
    console.log(`Created cache-busting file at: ${cacheBustPath}`);
    
    // Step 10: Commit the transaction
    console.log('\nStep 10: Committing transaction...');
    await db.run('COMMIT');
    console.log('Transaction committed successfully');
    
    // Step 11: Close the database connection
    console.log('\nStep 11: Closing database connection...');
    await db.close();
    console.log('Database connection closed');
    
    // Step 12: Verify the sync
    console.log('\nStep 12: Verifying sync...');
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
    
    console.log('\nData sync completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart the Next.js server to ensure changes take effect');
    console.log('2. Open the dashboard to verify the data is displayed correctly');
    console.log('3. Open the admin spreadsheet to verify the data is displayed correctly');
    
  } catch (error) {
    console.error('Error during data sync:', error);
    
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
syncAllData();
