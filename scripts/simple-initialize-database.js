/**
 * Simple script to initialize the database with working SQL expressions for Accounts data
 * This script directly creates the database tables and inserts the data
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Define the SQL expressions for each account type and month
const accountSqlExpressions = [
  // Accounts Payable
  { id: '6', name: 'Accounts Payable Jan', chartGroup: 'Accounts', variableName: 'Payable, Jan', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '7', name: 'Accounts Payable Feb', chartGroup: 'Accounts', variableName: 'Payable, Feb', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '8', name: 'Accounts Payable Mar', chartGroup: 'Accounts', variableName: 'Payable, Mar', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '9', name: 'Accounts Payable Apr', chartGroup: 'Accounts', variableName: 'Payable, Apr', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '10', name: 'Accounts Payable May', chartGroup: 'Accounts', variableName: 'Payable, May', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '11', name: 'Accounts Payable Jun', chartGroup: 'Accounts', variableName: 'Payable, Jun', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '12', name: 'Accounts Payable Jul', chartGroup: 'Accounts', variableName: 'Payable, Jul', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '13', name: 'Accounts Payable Aug', chartGroup: 'Accounts', variableName: 'Payable, Aug', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '14', name: 'Accounts Payable Sep', chartGroup: 'Accounts', variableName: 'Payable, Sep', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '15', name: 'Accounts Payable Oct', chartGroup: 'Accounts', variableName: 'Payable, Oct', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '16', name: 'Accounts Payable Nov', chartGroup: 'Accounts', variableName: 'Payable, Nov', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '17', name: 'Accounts Payable Dec', chartGroup: 'Accounts', variableName: 'Payable, Dec', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Receivable
  { id: '18', name: 'Accounts Receivable Jan', chartGroup: 'Accounts', variableName: 'Receivable, Jan', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '19', name: 'Accounts Receivable Feb', chartGroup: 'Accounts', variableName: 'Receivable, Feb', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '20', name: 'Accounts Receivable Mar', chartGroup: 'Accounts', variableName: 'Receivable, Mar', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '21', name: 'Accounts Receivable Apr', chartGroup: 'Accounts', variableName: 'Receivable, Apr', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '22', name: 'Accounts Receivable May', chartGroup: 'Accounts', variableName: 'Receivable, May', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '23', name: 'Accounts Receivable Jun', chartGroup: 'Accounts', variableName: 'Receivable, Jun', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '24', name: 'Accounts Receivable Jul', chartGroup: 'Accounts', variableName: 'Receivable, Jul', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '25', name: 'Accounts Receivable Aug', chartGroup: 'Accounts', variableName: 'Receivable, Aug', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '26', name: 'Accounts Receivable Sep', chartGroup: 'Accounts', variableName: 'Receivable, Sep', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '27', name: 'Accounts Receivable Oct', chartGroup: 'Accounts', variableName: 'Receivable, Oct', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '28', name: 'Accounts Receivable Nov', chartGroup: 'Accounts', variableName: 'Receivable, Nov', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '29', name: 'Accounts Receivable Dec', chartGroup: 'Accounts', variableName: 'Receivable, Dec', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Overdue
  { id: '30', name: 'Accounts Overdue Jan', chartGroup: 'Accounts', variableName: 'Overdue, Jan', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 1" },
  { id: '31', name: 'Accounts Overdue Feb', chartGroup: 'Accounts', variableName: 'Overdue, Feb', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 2" },
  { id: '32', name: 'Accounts Overdue Mar', chartGroup: 'Accounts', variableName: 'Overdue, Mar', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 3" },
  { id: '33', name: 'Accounts Overdue Apr', chartGroup: 'Accounts', variableName: 'Overdue, Apr', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 4" },
  { id: '34', name: 'Accounts Overdue May', chartGroup: 'Accounts', variableName: 'Overdue, May', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 5" },
  { id: '35', name: 'Accounts Overdue Jun', chartGroup: 'Accounts', variableName: 'Overdue, Jun', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 6" },
  { id: '36', name: 'Accounts Overdue Jul', chartGroup: 'Accounts', variableName: 'Overdue, Jul', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 7" },
  { id: '37', name: 'Accounts Overdue Aug', chartGroup: 'Accounts', variableName: 'Overdue, Aug', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 8" },
  { id: '38', name: 'Accounts Overdue Sep', chartGroup: 'Accounts', variableName: 'Overdue, Sep', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 9" },
  { id: '39', name: 'Accounts Overdue Oct', chartGroup: 'Accounts', variableName: 'Overdue, Oct', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 10" },
  { id: '40', name: 'Accounts Overdue Nov', chartGroup: 'Accounts', variableName: 'Overdue, Nov', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 11" },
  { id: '41', name: 'Accounts Overdue Dec', chartGroup: 'Accounts', variableName: 'Overdue, Dec', serverName: 'P21', tableName: 'dbo.customer', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 12" }
];

// Chart group settings
const chartGroupSettings = [
  { id: '1', name: 'AR Aging', display_order: 1, is_visible: 1, settings: { chartType: 'bar' } },
  { id: '2', name: 'Accounts', display_order: 2, is_visible: 1, settings: { chartType: 'line' } },
  { id: '3', name: 'Customer Metrics', display_order: 3, is_visible: 1, settings: { chartType: 'line' } },
  { id: '4', name: 'Daily Orders', display_order: 4, is_visible: 1, settings: { chartType: 'bar' } },
  { id: '5', name: 'Historical Data', display_order: 5, is_visible: 1, settings: { chartType: 'line' } },
  { id: '6', name: 'Inventory', display_order: 6, is_visible: 1, settings: { chartType: 'bar' } },
  { id: '7', name: 'Key Metrics', display_order: 7, is_visible: 1, settings: { chartType: 'value' } },
  { id: '8', name: 'Site Distribution', display_order: 8, is_visible: 1, settings: { chartType: 'pie' } },
  { id: '9', name: 'POR Overview', display_order: 9, is_visible: 1, settings: { chartType: 'line' } },
  { id: '10', name: 'Web Orders', display_order: 10, is_visible: 1, settings: { chartType: 'line' } }
];

// Server configurations
const serverConfigs = [
  {
    id: '1',
    name: 'P21',
    host: 'localhost',
    port: 1433,
    database: 'P21',
    username: 'sa',
    password: 'password',
    is_active: 1,
    connection_type: 'sqlserver',
    server: 'localhost',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'POR',
    host: 'localhost',
    port: 0,
    database: 'C:\\POR\\PORData.mdb',
    username: 'admin',
    password: '',
    is_active: 1,
    connection_type: 'access',
    server: 'localhost',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Function to initialize the database
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Check if the database file exists
    if (fs.existsSync(dbPath)) {
      console.log(`Database file exists at: ${dbPath}`);
      
      // Create a backup of the existing database
      const backupPath = `${dbPath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`Created backup of existing database at: ${backupPath}`);
    } else {
      console.log(`Database file does not exist at: ${dbPath}, will create a new one`);
      
      // Ensure the data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory at: ${dataDir}`);
      }
    }
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    try {
      // 1. Create or reset the chart_data table
      console.log('Creating/resetting chart_data table...');
      await db.exec(`
        DROP TABLE IF EXISTS chart_data;
        CREATE TABLE chart_data (
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
      
      // 2. Create or reset the chart_groups table
      console.log('Creating/resetting chart_groups table...');
      await db.exec(`
        DROP TABLE IF EXISTS chart_groups;
        CREATE TABLE chart_groups (
          id TEXT PRIMARY KEY,
          name TEXT,
          display_order INTEGER,
          is_visible INTEGER DEFAULT 1,
          settings TEXT
        )
      `);
      
      // 3. Create or reset the server_configs table
      console.log('Creating/resetting server_configs table...');
      await db.exec(`
        DROP TABLE IF EXISTS server_configs;
        CREATE TABLE server_configs (
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
      
      // 4. Insert Accounts data
      console.log('Inserting Accounts data...');
      for (const account of accountSqlExpressions) {
        await db.run(`
          INSERT OR REPLACE INTO chart_data (
            id,
            DataPoint,
            chart_group,
            variable_name,
            server_name,
            table_name,
            calculation,
            production_sql_expression,
            value,
            last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          account.id,
          account.name,
          account.chartGroup,
          account.variableName,
          account.serverName,
          account.tableName,
          'number',
          account.sql,
          '639000', // Default value
          new Date().toISOString()
        ]);
      }
      
      // 5. Insert chart group settings
      console.log('Inserting chart group settings...');
      for (const group of chartGroupSettings) {
        await db.run(`
          INSERT INTO chart_groups (
            id,
            name,
            display_order,
            is_visible,
            settings
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          group.id,
          group.name,
          group.display_order,
          group.is_visible,
          JSON.stringify(group.settings || {})
        ]);
      }
      
      // 6. Insert server configs
      console.log('Inserting server configs...');
      for (const config of serverConfigs) {
        await db.run(`
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
          config.name,
          config.host,
          config.port,
          config.database,
          config.username,
          config.password,
          config.is_active,
          config.connection_type,
          config.server,
          config.created_at,
          config.updated_at,
          JSON.stringify({})
        ]);
      }
      
      // 7. Generate the single-source-data.ts file
      console.log('Generating single-source-data.ts file...');
      
      // Get all chart data
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
      
      // Get chart group settings
      const dbChartGroupSettings = await db.all(`
        SELECT 
          id,
          name,
          display_order,
          is_visible,
          settings
        FROM chart_groups
      `);
      
      // Process chart group settings
      const processedChartGroupSettings = dbChartGroupSettings.map((group) => {
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
      const dbServerConfigs = await db.all(`
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
      
      // Process server configs
      const processedServerConfigs = dbServerConfigs.map((config) => {
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
export const dashboardData: SpreadsheetRow[] = ${JSON.stringify(chartData, null, 2)};

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};`;
      
      // Write the file
      const filePath = path.join(process.cwd(), 'lib', 'db', 'single-source-data.ts');
      fs.writeFileSync(filePath, fileContent);
      console.log(`Generated single-source-data.ts file at: ${filePath}`);
      
      // Commit all changes
      await db.run('COMMIT');
      console.log('Successfully committed all changes to database');
      
      // 8. Verify the data was loaded correctly
      console.log('\nVerifying data was loaded correctly...');
      
      const chartDataCount = await db.get('SELECT COUNT(*) as count FROM chart_data');
      console.log(`Chart data rows: ${chartDataCount.count}`);
      
      const chartGroupsCount = await db.get('SELECT COUNT(*) as count FROM chart_groups');
      console.log(`Chart group settings: ${chartGroupsCount.count}`);
      
      const serverConfigsCount = await db.get('SELECT COUNT(*) as count FROM server_configs');
      console.log(`Server configs: ${serverConfigsCount.count}`);
      
      // Check Accounts Payable Jan specifically
      const accountsPayableJan = await db.get('SELECT * FROM chart_data WHERE id = ?', '6');
      if (accountsPayableJan) {
        console.log('\nAccounts Payable Jan (ID: 6):');
        console.log(`Value: ${accountsPayableJan.value}`);
        console.log(`SQL Expression: ${accountsPayableJan.production_sql_expression}`);
      } else {
        console.log('Accounts Payable Jan (ID: 6) not found in the database');
      }
      
      // Close the database connection
      await db.close();
      
      console.log('\nDatabase initialization completed successfully');
      console.log('You can now start the application and use the dashboard');
      
    } catch (error) {
      // Rollback transaction on error
      await db.run('ROLLBACK');
      console.error('Error during database initialization, rolled back changes:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run the function
initializeDatabase();
