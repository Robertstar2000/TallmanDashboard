// Script to update chart group variables according to the specified requirements
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// Define the target structure
const targetStructure = {
  'AR Aging': {
    variables: ['Amount Due'],
    categories: ['1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Current'],
    totalRows: 5
  },
  'Accounts': {
    variables: ['Payable', 'Receivable', 'Overdue'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 36
  },
  'Customer Metrics': {
    variables: ['New', 'Prospects'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 24
  },
  'Daily Orders': {
    variables: ['Orders'],
    days: ['Today', 'Today-1', 'Today-2', 'Today-3', 'Today-4', 'Today-5', 'Today-6'],
    totalRows: 7
  },
  'Historical Data': {
    variables: ['P21', 'POR', 'Total {P21+POR}'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 36
  },
  'Inventory': {
    variables: ['In Stock', 'On Order'],
    departments: ['Department 1', 'Department 2', 'Department 3', 'Department 4'],
    totalRows: 8
  },
  'Key Metrics': {
    variables: ['Total Orders', 'Open Orders', 'Total Sales Monthly', 'Daily Revenue', 'Turnover Rate', 'Open Invoices', 'Payable'],
    totalRows: 7
  },
  'Site Distribution': {
    variables: ['Value'],
    locations: ['Columbus', 'Addison', 'Lake City'],
    totalRows: 3
  },
  'POR Overview': {
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 36
  },
  'Web Orders': {
    variables: ['Orders'],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    totalRows: 12
  }
};

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

// Open database connection
let db;
try {
  db = new Database(dbPath);
  console.log(`Connected to the database at ${dbPath}`);
} catch (err) {
  console.error(`Error opening database: ${err.message}`);
  process.exit(1);
}

// Function to get current chart data from database
function getCurrentChartData() {
  try {
    return db.prepare('SELECT * FROM chart_data').all();
  } catch (err) {
    console.error(`Error getting chart data: ${err.message}`);
    return [];
  }
}

// Function to extract month from chart_name
function extractMonthFromChartName(chartName) {
  if (!chartName) return null;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const month of months) {
    if (chartName.includes(month)) {
      return month;
    }
  }
  return null;
}

// Function to extract location from chart_name
function extractLocationFromChartName(chartName) {
  if (!chartName) return null;
  
  const locations = ['Columbus', 'Jackson', 'Elk City', 'Addison', 'Lake City'];
  for (const location of locations) {
    if (chartName.includes(location)) {
      return location;
    }
  }
  return null;
}

// Function to update variable names in existing data
function updateVariableNames(currentData) {
  const updates = [];
  
  // Customer Metrics: Replace 'Active' with 'Prospects'
  currentData.forEach(row => {
    if (row.chart_group === 'Customer Metrics' && row.variable_name === 'Active') {
      updates.push({
        id: row.id,
        old_name: row.variable_name,
        new_name: 'Prospects',
        chart_group: row.chart_group
      });
    }
  });
  
  // Daily Orders: Replace weekday names with 'Today' through 'Today-6'
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailyOrderRows = currentData.filter(row => row.chart_group === 'Daily Orders');
  
  if (dailyOrderRows.length === 7) {
    dailyOrderRows.forEach((row, index) => {
      if (weekdays.includes(row.variable_name)) {
        updates.push({
          id: row.id,
          old_name: row.variable_name,
          new_name: index === 0 ? 'Today' : `Today-${index}`,
          chart_group: row.chart_group
        });
      }
    });
  }
  
  // Historical Data: Replace 'Orders' and 'Revenue' with 'P21' and 'POR'
  currentData.forEach(row => {
    if (row.chart_group === 'Historical Data') {
      if (row.variable_name === 'Orders') {
        updates.push({
          id: row.id,
          old_name: row.variable_name,
          new_name: 'P21',
          chart_group: row.chart_group
        });
      } else if (row.variable_name === 'Revenue') {
        updates.push({
          id: row.id,
          old_name: row.variable_name,
          new_name: 'POR',
          chart_group: row.chart_group
        });
      }
    }
  });
  
  // Site Distribution: Update chart_name for locations
  currentData.forEach(row => {
    if (row.chart_group === 'Site Distribution') {
      const location = extractLocationFromChartName(row.chart_name);
      
      if (location === 'Jackson') {
        updates.push({
          id: row.id,
          old_name: 'Jackson',
          new_name: 'Addison',
          chart_group: row.chart_group,
          is_location: true
        });
      } else if (location === 'Elk City') {
        updates.push({
          id: row.id,
          old_name: 'Elk City',
          new_name: 'Lake City',
          chart_group: row.chart_group,
          is_location: true
        });
      }
    }
  });
  
  return updates;
}

// Function to apply variable name updates to the database
function applyVariableNameUpdates(updates) {
  const stmt = db.prepare(`
    UPDATE chart_data 
    SET variable_name = ?
    WHERE id = ?
  `);
  
  const chartNameStmt = db.prepare(`
    UPDATE chart_data 
    SET chart_name = REPLACE(chart_name, ?, ?)
    WHERE id = ?
  `);
  
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    updates.forEach(update => {
      if (update.is_location) {
        // Update chart_name if it contains the old location name
        chartNameStmt.run(
          update.old_name,
          update.new_name,
          update.id
        );
      } else {
        stmt.run(
          update.new_name,
          update.id
        );
        
        // Also update chart_name if it contains the old variable name
        chartNameStmt.run(
          update.old_name,
          update.new_name,
          update.id
        );
      }
      console.log(`Updated ${update.chart_group}: ${update.old_name} -> ${update.new_name}`);
    });
    
    db.prepare('COMMIT').run();
    return true;
  } catch (err) {
    db.prepare('ROLLBACK').run();
    console.error(`Error applying updates: ${err.message}`);
    return false;
  }
}

// Function to add missing rows to the database
function addMissingRows(currentData) {
  // Identify missing rows based on the target structure
  const missingRows = [];
  
  // Get months from chart names for Historical Data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // For each month, check if we need to add a 'Total {P21+POR}' row
  months.forEach(month => {
    // Check if there's already a Total row for this month
    const hasTotal = currentData.some(row => 
      row.chart_group === 'Historical Data' && 
      row.variable_name === 'Total {P21+POR}' && 
      row.chart_name && row.chart_name.includes(month)
    );
    
    if (!hasTotal) {
      // Find a template row for this month
      const templateRow = currentData.find(row => 
        row.chart_group === 'Historical Data' && 
        row.chart_name && row.chart_name.includes(month)
      );
      
      if (templateRow) {
        // Generate a new ID
        const maxId = Math.max(...currentData.map(row => parseInt(row.id || '0')));
        const newId = (maxId + missingRows.length + 1).toString();
        
        missingRows.push({
          id: newId,
          chart_name: `Historical Data - Total {P21+POR} - ${month}`,
          chart_group: 'Historical Data',
          variable_name: 'Total {P21+POR}',
          server_name: 'Internal',
          value: '0',
          sql_expression: `SELECT SUM(CAST(value AS REAL)) FROM chart_data WHERE chart_group = 'Historical Data' AND chart_name LIKE '%${month}%' AND variable_name IN ('P21', 'POR')`,
          production_sql_expression: `SELECT SUM(CAST(value AS REAL)) FROM chart_data WHERE chart_group = 'Historical Data' AND chart_name LIKE '%${month}%' AND variable_name IN ('P21', 'POR')`,
          db_table_name: 'chart_data',
          last_updated: new Date().toISOString()
        });
      }
    }
  });
  
  return missingRows;
}

// Function to insert missing rows into the database
function insertMissingRows(missingRows) {
  if (missingRows.length === 0) {
    console.log('No missing rows to insert');
    return true;
  }
  
  const stmt = db.prepare(`
    INSERT INTO chart_data (
      id, chart_name, chart_group, variable_name, 
      server_name, value, sql_expression, production_sql_expression, 
      db_table_name, last_updated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    missingRows.forEach(row => {
      stmt.run(
        row.id,
        row.chart_name,
        row.chart_group,
        row.variable_name,
        row.server_name,
        row.value,
        row.sql_expression,
        row.production_sql_expression,
        row.db_table_name,
        row.last_updated
      );
      console.log(`Added new row: ${row.chart_name}`);
    });
    
    db.prepare('COMMIT').run();
    return true;
  } catch (err) {
    db.prepare('ROLLBACK').run();
    console.error(`Error inserting missing rows: ${err.message}`);
    return false;
  }
}

// Function to update the initial-data.ts file
function updateInitialDataFile() {
  // Get updated chart data from database
  const chartData = db.prepare(`
    SELECT 
      id,
      chart_name as name,
      chart_group as chartGroup,
      variable_name as variableName,
      server_name as serverName,
      value,
      sql_expression as sqlExpression,
      production_sql_expression as productionSqlExpression,
      db_table_name as tableName,
      last_updated as lastUpdated
    FROM chart_data
  `).all();
  
  const timestamp = new Date().toISOString();
  
  let content = `
import { getMode } from '@/lib/state/dashboardState';

export type SpreadsheetRow = {
  id: string;
  name: string;
  chartGroup: string;
  variableName: string;
  serverName: string;
  value: string;
  calculation: string;
  sqlExpression: string;
  productionSqlExpression: string;
  tableName: string;
  timeframe?: string;
  lastUpdated?: string;
  category?: string;
};

export interface ChartGroupSetting {
  id: string;
  name: string;
  display_order: number;
  is_visible: number;
  settings: Record<string, any>;
}

export interface ServerConfig {
  id: number;
  server_name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  created_at?: string;
  updated_at?: string;
  config?: string;
  server?: string;
}

// This file was auto-generated by the update-chart-variables.js script
// Last updated: ${timestamp}

// Chart data from the admin spreadsheet
export const initialSpreadsheetData: SpreadsheetRow[] = [
`;

  // Add each row of chart data
  chartData.forEach((row, index) => {
    // Extract timeframe and category from chart_name if possible
    const timeframe = extractMonthFromChartName(row.name);
    const category = extractLocationFromChartName(row.name);
    
    content += `  {
    id: '${row.id}',
    name: '${row.name || ''}',
    chartGroup: '${row.chartGroup || ''}',
    variableName: '${row.variableName || ''}',
    serverName: '${row.serverName || ''}',
    value: '${row.value || '0'}',
    calculation: '',
    sqlExpression: \`${row.sqlExpression || ''}\`,
    productionSqlExpression: \`${row.productionSqlExpression || ''}\`,
    tableName: '${row.tableName || ''}'${timeframe ? `,
    timeframe: '${timeframe}'` : ''}${category ? `,
    category: '${category}'` : ''}${row.lastUpdated ? `,
    lastUpdated: '${row.lastUpdated}'` : ''}
  }${index < chartData.length - 1 ? ',' : ''}
`;
  });

  content += `];

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = [];

// Server connection settings
export const serverConfigs: ServerConfig[] = [
  {
    id: 1,
    server_name: 'P21',
    host: 'localhost',
    port: 1433,
    database: 'P21',
    username: 'p21user',
    password: 'password',
    created_at: '${timestamp}',
    updated_at: '${timestamp}'
  },
  {
    id: 2,
    server_name: 'POR',
    host: 'localhost',
    port: 1433,
    database: 'POR',
    username: 'poruser',
    password: 'password',
    created_at: '${timestamp}',
    updated_at: '${timestamp}'
  }
];
`;

  try {
    // Create a backup of the current file
    const backupPath = `${initialDataPath}.backup-${Date.now()}.ts`;
    fs.copyFileSync(initialDataPath, backupPath);
    console.log(`Created backup of initial-data.ts at ${backupPath}`);
    
    // Write the new content
    fs.writeFileSync(initialDataPath, content);
    console.log(`Successfully updated ${initialDataPath}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${initialDataPath}: ${error.message}`);
    return false;
  }
}

// Main function to orchestrate the update process
function updateChartStructure() {
  try {
    console.log('Getting current chart data...');
    const currentData = getCurrentChartData();
    console.log(`Found ${currentData.length} rows of chart data`);
    
    console.log('Identifying variable name updates...');
    const updates = updateVariableNames(currentData);
    console.log(`Found ${updates.length} variable names to update`);
    
    if (updates.length > 0) {
      console.log('Applying variable name updates...');
      const success = applyVariableNameUpdates(updates);
      if (!success) {
        throw new Error('Failed to apply variable name updates');
      }
    }
    
    // Get updated data after applying changes
    const updatedData = getCurrentChartData();
    
    console.log('Identifying missing rows...');
    const missingRows = addMissingRows(updatedData);
    console.log(`Found ${missingRows.length} missing rows to add`);
    
    if (missingRows.length > 0) {
      console.log('Inserting missing rows...');
      const success = insertMissingRows(missingRows);
      if (!success) {
        throw new Error('Failed to insert missing rows');
      }
    }
    
    console.log('Updating initial-data.ts file...');
    updateInitialDataFile();
    
    console.log('\nChart variable update completed successfully!');
  } catch (error) {
    console.error(`Error during update: ${error.message}`);
  } finally {
    // Close the database connection
    if (db) {
      db.close();
      console.log('Database connection closed');
    }
  }
}

// Run the update process
updateChartStructure();
