// Script to completely fix chart structure according to requirements
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the database
const db = new Database('./data/dashboard.db');

try {
  console.log('Connected to the database at', path.resolve('./data/dashboard.db'));
  console.log('\n=== FIXING CHART STRUCTURE COMPLETELY ===\n');
  
  // Start a transaction
  db.prepare('BEGIN').run();
  
  // Define the expected structure
  const expectedStructure = {
    'AR Aging': {
      variables: ['Amount Due'],
      count: 5, // 5 buckets
      chartNames: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days']
    },
    'Accounts': {
      variables: ['Payable', 'Receivable', 'Overdue'],
      count: 36, // 3 variables x 12 months
      monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    'Customer Metrics': {
      variables: ['New', 'Prospects'],
      count: 24, // 2 variables x 12 months
      monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    'Daily Orders': {
      variables: ['Orders'],
      count: 7, // 1 variable x 7 days
      chartNames: ['Today', 'Today-1', 'Today-2', 'Today-3', 'Today-4', 'Today-5', 'Today-6']
    },
    'Historical Data': {
      variables: ['P21', 'POR', 'Total {P21+POR}'],
      count: 36, // 3 variables x 12 months
      monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    'Inventory': {
      variables: ['In Stock', 'On Order'],
      count: 8, // 2 variables x 4 departments
      chartNames: ['Tools', 'Safety', 'Consumables', 'Equipment']
    },
    'Key Metrics': {
      count: 7, // 7 separate metrics
      chartNames: [
        'Total Orders', 'Open Orders', 'Daily Revenue', 
        'Open Invoices', 'Orders Backlogged', 'Total Monthly Sales', 'Total Items'
      ]
    },
    'Site Distribution': {
      variables: ['Columbus', 'Addison', 'Lake City'],
      count: 3 // 1 value for 3 locations
    },
    'POR Overview': {
      variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
      count: 36, // 3 variables x 12 months
      monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    'Web Orders': {
      variables: ['Orders'],
      count: 12, // 1 variable x 12 months
      monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    }
  };
  
  // Get the highest ID in the chart_data table
  const maxIdResult = db.prepare('SELECT MAX(CAST(id AS INTEGER)) as maxId FROM chart_data').get();
  let nextId = parseInt(maxIdResult.maxId) + 1;
  console.log(`Next available ID: ${nextId}`);
  
  // Delete all existing data
  const deleteAll = db.prepare('DELETE FROM chart_data').run();
  console.log(`Deleted all ${deleteAll.changes} existing rows`);
  
  // Function to create a row
  function createRow(id, chartGroup, chartName, variableName, serverName = 'P21') {
    return {
      id: id.toString(),
      chart_group: chartGroup,
      chart_name: chartName,
      variable_name: variableName,
      server_name: serverName,
      sql_expression: `SELECT 0 /* Default SQL for ${chartGroup} - ${variableName} */`,
      production_sql_expression: `SELECT 0 /* Default SQL for ${chartGroup} - ${variableName} */`,
      db_table_name: '',
      value: '0',
      last_updated: new Date().toISOString()
    };
  }
  
  // Function to insert a row
  function insertRow(row) {
    const insertStmt = db.prepare(`
      INSERT INTO chart_data (
        id, chart_name, chart_group, variable_name, 
        server_name, sql_expression, production_sql_expression, 
        db_table_name, value, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertStmt.run(
      row.id,
      row.chart_name,
      row.chart_group,
      row.variable_name,
      row.server_name,
      row.sql_expression,
      row.production_sql_expression,
      row.db_table_name,
      row.value,
      row.last_updated
    );
  }
  
  // Create and insert rows for each chart group
  let totalRowsCreated = 0;
  
  // 1. AR Aging
  console.log('\nCreating AR Aging rows...');
  for (let i = 0; i < expectedStructure['AR Aging'].chartNames.length; i++) {
    const chartName = expectedStructure['AR Aging'].chartNames[i];
    const row = createRow(nextId++, 'AR Aging', chartName, 'Amount Due');
    insertRow(row);
    totalRowsCreated++;
    console.log(`Added AR Aging row for ${chartName}`);
  }
  
  // 2. Accounts
  console.log('\nCreating Accounts rows...');
  for (const variable of expectedStructure['Accounts'].variables) {
    for (const month of expectedStructure['Accounts'].monthNames) {
      const row = createRow(nextId++, 'Accounts', month, variable);
      insertRow(row);
      totalRowsCreated++;
    }
    console.log(`Added 12 Accounts rows for ${variable}`);
  }
  
  // 3. Customer Metrics
  console.log('\nCreating Customer Metrics rows...');
  for (const variable of expectedStructure['Customer Metrics'].variables) {
    for (const month of expectedStructure['Customer Metrics'].monthNames) {
      const row = createRow(nextId++, 'Customer Metrics', month, variable);
      insertRow(row);
      totalRowsCreated++;
    }
    console.log(`Added 12 Customer Metrics rows for ${variable}`);
  }
  
  // 4. Daily Orders
  console.log('\nCreating Daily Orders rows...');
  for (const day of expectedStructure['Daily Orders'].chartNames) {
    const row = createRow(nextId++, 'Daily Orders', day, 'Orders');
    insertRow(row);
    totalRowsCreated++;
  }
  console.log(`Added 7 Daily Orders rows`);
  
  // 5. Historical Data
  console.log('\nCreating Historical Data rows...');
  for (const variable of expectedStructure['Historical Data'].variables) {
    for (const month of expectedStructure['Historical Data'].monthNames) {
      const row = createRow(nextId++, 'Historical Data', month, variable);
      insertRow(row);
      totalRowsCreated++;
    }
    console.log(`Added 12 Historical Data rows for ${variable}`);
  }
  
  // 6. Inventory
  console.log('\nCreating Inventory rows...');
  for (const variable of expectedStructure['Inventory'].variables) {
    for (const department of expectedStructure['Inventory'].chartNames) {
      const row = createRow(nextId++, 'Inventory', department, variable);
      insertRow(row);
      totalRowsCreated++;
    }
    console.log(`Added 4 Inventory rows for ${variable}`);
  }
  
  // 7. Key Metrics
  console.log('\nCreating Key Metrics rows...');
  for (const metric of expectedStructure['Key Metrics'].chartNames) {
    const row = createRow(nextId++, 'Key Metrics', 'Key Metrics', metric);
    insertRow(row);
    totalRowsCreated++;
    console.log(`Added Key Metrics row for ${metric}`);
  }
  
  // 8. Site Distribution
  console.log('\nCreating Site Distribution rows...');
  for (const location of expectedStructure['Site Distribution'].variables) {
    const row = createRow(nextId++, 'Site Distribution', 'Site Distribution', location);
    insertRow(row);
    totalRowsCreated++;
    console.log(`Added Site Distribution row for ${location}`);
  }
  
  // 9. POR Overview
  console.log('\nCreating POR Overview rows...');
  for (const variable of expectedStructure['POR Overview'].variables) {
    for (const month of expectedStructure['POR Overview'].monthNames) {
      const row = createRow(nextId++, 'POR Overview', month, variable, 'POR');
      insertRow(row);
      totalRowsCreated++;
    }
    console.log(`Added 12 POR Overview rows for ${variable}`);
  }
  
  // 10. Web Orders
  console.log('\nCreating Web Orders rows...');
  for (const month of expectedStructure['Web Orders'].monthNames) {
    const row = createRow(nextId++, 'Web Orders', month, 'Orders');
    insertRow(row);
    totalRowsCreated++;
  }
  console.log(`Added 12 Web Orders rows`);
  
  // Commit the transaction
  db.prepare('COMMIT').run();
  console.log(`\nTotal rows created: ${totalRowsCreated}`);
  console.log('All fixes have been applied to the database');
  
  // Now regenerate the initial-data.ts file
  console.log('\nRegenerating initial-data.ts file...');
  
  // Get all chart data from the database
  const chartData = db.prepare('SELECT * FROM chart_data ORDER BY chart_group, id').all();
  
  // Path to the initial-data.ts file
  const initialDataPath = path.resolve('./lib/db/initial-data.ts');
  
  // Create a backup of the file
  const backupPath = `${initialDataPath}.backup-${Date.now()}.ts`;
  fs.copyFileSync(initialDataPath, backupPath);
  console.log(`Created backup of initial-data.ts at ${backupPath}`);
  
  // Generate the new file content
  let newContent = `
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

// This file was auto-generated by the fix-chart-structure-complete.js script
// Last updated: ${new Date().toISOString()}

// Chart data from the admin spreadsheet
export const initialSpreadsheetData: SpreadsheetRow[] = [
`;
  
  // Add each row from the database
  for (const row of chartData) {
    newContent += `  {
    id: '${row.id}',
    name: '',
    chartGroup: '${row.chart_group}',
    variableName: '${row.variable_name}',
    serverName: '${row.server_name || 'P21'}',
    value: '${row.value || '0'}',
    calculation: 'COUNT(*)',
    sqlExpression: \`${row.sql_expression || 'SELECT 0'}\`,
    productionSqlExpression: \`${row.production_sql_expression || 'SELECT 0'}\`,
    tableName: '${row.db_table_name || ''}'
  },
`;
  }
  
  // Close the array and add the chart group settings
  newContent += `];

// Chart group settings
export const chartGroupSettings: ChartGroupSetting[] = [];

// Server configurations
export const serverConfigs: ServerConfig[] = [
  {
    id: 1,
    server_name: 'P21',
    host: 'localhost',
    port: 1433,
    database: 'P21',
    username: 'sa',
    password: 'password',
    server: 'P21'
  },
  {
    id: 2,
    server_name: 'POR',
    host: 'localhost',
    port: 1433,
    database: 'POR',
    username: 'sa',
    password: 'password',
    server: 'POR'
  }
];
`;
  
  // Write the new file
  fs.writeFileSync(initialDataPath, newContent);
  console.log(`Successfully regenerated ${initialDataPath} from database`);
  
  console.log('\nChart structure fixes completed!');
} catch (err) {
  // Rollback the transaction
  db.prepare('ROLLBACK').run();
  console.error('Error:', err.message);
} finally {
  // Close the database connection
  db.close();
  console.log('Database connection closed');
}
