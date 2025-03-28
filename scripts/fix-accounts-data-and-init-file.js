// Script to fix Accounts data in both the database and the initialization file
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// Path to the initialization file
const initFilePath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// Define the SQL expressions for each account type and month
const accountSqlExpressions = [
  // Accounts Payable
  { id: '6', name: 'Accounts Payable Jan', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '7', name: 'Accounts Payable Feb', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '8', name: 'Accounts Payable Mar', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '9', name: 'Accounts Payable Apr', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '10', name: 'Accounts Payable May', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '11', name: 'Accounts Payable Jun', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '12', name: 'Accounts Payable Jul', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '13', name: 'Accounts Payable Aug', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '14', name: 'Accounts Payable Sep', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '15', name: 'Accounts Payable Oct', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '16', name: 'Accounts Payable Nov', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '17', name: 'Accounts Payable Dec', sql: "SELECT COUNT(*) * 1000 AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Receivable
  { id: '18', name: 'Accounts Receivable Jan', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 1" },
  { id: '19', name: 'Accounts Receivable Feb', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 2" },
  { id: '20', name: 'Accounts Receivable Mar', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 3" },
  { id: '21', name: 'Accounts Receivable Apr', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 4" },
  { id: '22', name: 'Accounts Receivable May', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 5" },
  { id: '23', name: 'Accounts Receivable Jun', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 6" },
  { id: '24', name: 'Accounts Receivable Jul', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 7" },
  { id: '25', name: 'Accounts Receivable Aug', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 8" },
  { id: '26', name: 'Accounts Receivable Sep', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 9" },
  { id: '27', name: 'Accounts Receivable Oct', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 10" },
  { id: '28', name: 'Accounts Receivable Nov', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 11" },
  { id: '29', name: 'Accounts Receivable Dec', sql: "SELECT SUM(credit_limit) AS value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(date_created) = 12" },
  
  // Accounts Overdue
  { id: '30', name: 'Accounts Overdue Jan', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 1" },
  { id: '31', name: 'Accounts Overdue Feb', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 2" },
  { id: '32', name: 'Accounts Overdue Mar', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 3" },
  { id: '33', name: 'Accounts Overdue Apr', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 4" },
  { id: '34', name: 'Accounts Overdue May', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 5" },
  { id: '35', name: 'Accounts Overdue Jun', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 6" },
  { id: '36', name: 'Accounts Overdue Jul', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 7" },
  { id: '37', name: 'Accounts Overdue Aug', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 8" },
  { id: '38', name: 'Accounts Overdue Sep', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 9" },
  { id: '39', name: 'Accounts Overdue Oct', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 10" },
  { id: '40', name: 'Accounts Overdue Nov', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 11" },
  { id: '41', name: 'Accounts Overdue Dec', sql: "SELECT SUM(credit_limit_used) AS value FROM dbo.customer WITH (NOLOCK) WHERE credit_limit_used > 0 AND MONTH(date_created) = 12" }
];

// Function to update the database and initialization file
async function fixAccountsDataAndInitFile() {
  try {
    console.log('Starting fix for Accounts data in database and initialization file...');
    
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Begin transaction for database updates
    await db.run('BEGIN TRANSACTION');
    
    // 1. First, update the database
    console.log('\nUpdating database with working SQL expressions...');
    
    for (const account of accountSqlExpressions) {
      // Update the SQL expression in the database
      await db.run(`
        UPDATE chart_data 
        SET production_sql_expression = ?
        WHERE id = ?
      `, [account.sql, account.id]);
      
      console.log(`Updated SQL expression for ID ${account.id} (${account.name}) in database`);
    }
    
    // Commit database changes
    await db.run('COMMIT');
    console.log('Database updates committed successfully');
    
    // 2. Now, save the database state to the initialization file
    console.log('\nSaving current database state to initialization file...');
    
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
        last_updated as "lastUpdated",
        transformer,
        timeframe
      FROM chart_data
    `);
    
    console.log(`Retrieved ${chartData.length} rows of chart data from database`);
    
    // Process chart data to ensure all fields have valid values
    const processedChartData = chartData.map((row) => {
      return {
        id: row.id || '',
        DataPoint: row.DataPoint || '',
        chartGroup: row.chartGroup || '',
        chartName: row.chartName || '',
        variableName: row.variableName || '',
        serverName: row.serverName || '',
        tableName: row.tableName || '',
        calculation: row.calculation || 'number',
        productionSqlExpression: row.productionSqlExpression || '',
        value: row.value || '0',
        lastUpdated: row.lastUpdated || new Date().toISOString()
      };
    });
    
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
    
    console.log(`Retrieved ${chartGroupSettings.length} chart group settings from database`);
    
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
        is_visible: group.is_visible === 1 || group.is_visible === true ? 1 : 0,
        settings
      };
    });
    
    // Get server configs
    const serverConfigs = await db.all(`
      SELECT 
        id,
        server_name,
        host,
        port,
        database,
        username,
        password,
        created_at,
        updated_at,
        connection_type,
        server,
        is_active
      FROM server_configs
    `);
    
    console.log(`Retrieved ${serverConfigs.length} server configs from database`);
    
    // Process server configs
    const processedServerConfigs = serverConfigs.map((config) => {
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
        updated_at: config.updated_at || new Date().toISOString()
      };
    });
    
    // Generate the file content
    const timestamp = new Date().toISOString();
    const fileContent = `// import { getMode } from '../../state/dashboardState';
// import Database from 'better-sqlite3';
import * as path from 'path';
import type { SpreadsheetRow, ChartGroupSetting, ServerConfig } from './types';
import { combinedSpreadsheetData } from './combined-spreadsheet-data';

// Export the combined data as initialSpreadsheetData
export { combinedSpreadsheetData as initialSpreadsheetData };

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = ${JSON.stringify(processedChartGroupSettings, null, 2)};

// Server configurations
export const serverConfigs: ServerConfig[] = ${JSON.stringify(processedServerConfigs, null, 2)};
`;
    
    // Write the file
    fs.writeFileSync(initFilePath, fileContent);
    console.log(`Successfully saved database content to: ${initFilePath}`);
    
    // 3. Now update the complete-chart-data.ts file with the working SQL expressions
    console.log('\nUpdating complete-chart-data.ts with working SQL expressions...');
    
    // Read the complete-chart-data.ts file
    const completeChartDataPath = path.join(process.cwd(), 'lib', 'db', 'complete-chart-data.ts');
    let completeChartDataContent = fs.readFileSync(completeChartDataPath, 'utf8');
    
    // Parse the file content to extract the data array
    const dataStartIndex = completeChartDataContent.indexOf('export const initialSpreadsheetData');
    const dataEndIndex = completeChartDataContent.lastIndexOf('];');
    
    if (dataStartIndex === -1 || dataEndIndex === -1) {
      throw new Error('Could not find data array in complete-chart-data.ts');
    }
    
    // Extract the data array as string
    const dataArrayString = completeChartDataContent.substring(
      dataStartIndex,
      dataEndIndex + 2 // Include the closing bracket and semicolon
    );
    
    // For each account, update the SQL expression in the file content
    for (const account of accountSqlExpressions) {
      // Create a regex pattern to find the entry for this account
      const pattern = new RegExp(`"id":\\s*"${account.id}"[^}]*"productionSqlExpression":\\s*"[^"]*"`, 'g');
      
      // Replace the SQL expression
      completeChartDataContent = completeChartDataContent.replace(
        pattern,
        (match) => match.replace(/"productionSqlExpression":\s*"[^"]*"/, `"productionSqlExpression": "${account.sql.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
      );
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(completeChartDataPath, completeChartDataContent);
    console.log(`Successfully updated SQL expressions in: ${completeChartDataPath}`);
    
    // 4. Update the combined-spreadsheet-data.ts file to ensure it imports from complete-chart-data.ts
    console.log('\nVerifying combined-spreadsheet-data.ts imports...');
    
    // Read the combined-spreadsheet-data.ts file
    const combinedDataPath = path.join(process.cwd(), 'lib', 'db', 'combined-spreadsheet-data.ts');
    const combinedDataContent = fs.readFileSync(combinedDataPath, 'utf8');
    
    // Check if it imports from complete-chart-data.ts
    if (!combinedDataContent.includes('import { initialSpreadsheetData as completeChartData } from \'./complete-chart-data\';') &&
        !combinedDataContent.includes('import { transformedCompleteChartData } from \'./transform-complete-chart-data\';')) {
      console.warn('Warning: combined-spreadsheet-data.ts may not be importing from complete-chart-data.ts correctly');
    } else {
      console.log('combined-spreadsheet-data.ts imports verified');
    }
    
    // Close the database connection
    await db.close();
    
    console.log('\nAll fixes completed successfully!');
    console.log('Please restart the application to see the changes');
    console.log('\nNow you can use the "Save DB" and "Load DB" buttons as expected:');
    console.log('- "Save DB" will save the current database state to the initialization file');
    console.log('- "Load DB" will load from that saved state');
  } catch (error) {
    console.error('Error fixing Accounts data:', error);
  }
}

// Run the function
fixAccountsDataAndInitFile();
