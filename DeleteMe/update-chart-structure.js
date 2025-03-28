const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to the database at ${dbPath}`);
});

// Function to get current chart data from database
async function getCurrentChartData() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM chart_data', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Function to generate new chart data based on target structure
function generateNewChartData() {
  let newData = [];
  let id = 1;

  // AR Aging
  targetStructure['AR Aging'].categories.forEach(category => {
    newData.push({
      id: id.toString(),
      name: `AR Aging - ${category}`,
      chart_group: 'AR Aging',
      variable_name: 'Amount Due',
      category: category,
      server_name: 'P21',
      value: (Math.floor(Math.random() * 100000) / 100).toFixed(2),
      sql_expression: `SELECT SUM(amount_due) FROM ar_aging WHERE bucket = '${category}'`,
      production_sql_expression: `SELECT SUM(amount_due) FROM ar_aging WHERE bucket = '${category}'`,
      table_name: 'ar_aging',
      last_updated: new Date().toISOString()
    });
    id++;
  });

  // Accounts
  targetStructure['Accounts'].variables.forEach(variable => {
    targetStructure['Accounts'].months.forEach(month => {
      newData.push({
        id: id.toString(),
        name: `Accounts - ${variable} - ${month}`,
        chart_group: 'Accounts',
        variable_name: variable,
        timeframe: month,
        server_name: 'P21',
        value: (Math.floor(Math.random() * 1000000) / 100).toFixed(2),
        sql_expression: `SELECT SUM(amount) FROM accounts WHERE type = '${variable}' AND month = '${month}'`,
        production_sql_expression: `SELECT SUM(amount) FROM accounts WHERE type = '${variable}' AND month = '${month}'`,
        table_name: 'accounts',
        last_updated: new Date().toISOString()
      });
      id++;
    });
  });

  // Customer Metrics
  targetStructure['Customer Metrics'].variables.forEach(variable => {
    targetStructure['Customer Metrics'].months.forEach(month => {
      newData.push({
        id: id.toString(),
        name: `Customer Metrics - ${variable} - ${month}`,
        chart_group: 'Customer Metrics',
        variable_name: variable,
        timeframe: month,
        server_name: 'P21',
        value: Math.floor(Math.random() * 1000).toString(),
        sql_expression: `SELECT COUNT(*) FROM customers WHERE status = '${variable}' AND month = '${month}'`,
        production_sql_expression: `SELECT COUNT(*) FROM customers WHERE status = '${variable}' AND month = '${month}'`,
        table_name: 'customers',
        last_updated: new Date().toISOString()
      });
      id++;
    });
  });

  // Daily Orders
  targetStructure['Daily Orders'].days.forEach(day => {
    newData.push({
      id: id.toString(),
      name: `Daily Orders - ${day}`,
      chart_group: 'Daily Orders',
      variable_name: 'Orders',
      timeframe: day,
      server_name: 'P21',
      value: Math.floor(Math.random() * 100).toString(),
      sql_expression: `SELECT COUNT(*) FROM orders WHERE day = '${day}'`,
      production_sql_expression: `SELECT COUNT(*) FROM orders WHERE day = '${day}'`,
      table_name: 'orders',
      last_updated: new Date().toISOString()
    });
    id++;
  });

  // Historical Data
  targetStructure['Historical Data'].variables.forEach(variable => {
    targetStructure['Historical Data'].months.forEach(month => {
      newData.push({
        id: id.toString(),
        name: `Historical Data - ${variable} - ${month}`,
        chart_group: 'Historical Data',
        variable_name: variable,
        timeframe: month,
        server_name: variable === 'P21' ? 'P21' : (variable === 'POR' ? 'POR' : 'Internal'),
        value: (Math.floor(Math.random() * 1000000) / 100).toFixed(2),
        sql_expression: `SELECT SUM(amount) FROM historical_data WHERE source = '${variable}' AND month = '${month}'`,
        production_sql_expression: `SELECT SUM(amount) FROM historical_data WHERE source = '${variable}' AND month = '${month}'`,
        table_name: 'historical_data',
        last_updated: new Date().toISOString()
      });
      id++;
    });
  });

  // Inventory
  targetStructure['Inventory'].variables.forEach(variable => {
    targetStructure['Inventory'].departments.forEach(department => {
      newData.push({
        id: id.toString(),
        name: `Inventory - ${variable} - ${department}`,
        chart_group: 'Inventory',
        variable_name: variable,
        category: department,
        server_name: 'P21',
        value: Math.floor(Math.random() * 10000).toString(),
        sql_expression: `SELECT SUM(quantity) FROM inventory WHERE status = '${variable}' AND department = '${department}'`,
        production_sql_expression: `SELECT SUM(quantity) FROM inventory WHERE status = '${variable}' AND department = '${department}'`,
        table_name: 'inventory',
        last_updated: new Date().toISOString()
      });
      id++;
    });
  });

  // Key Metrics
  targetStructure['Key Metrics'].variables.forEach(variable => {
    newData.push({
      id: id.toString(),
      name: `Key Metrics - ${variable}`,
      chart_group: 'Key Metrics',
      variable_name: variable,
      server_name: 'P21',
      value: variable.includes('Rate') ? 
        (Math.random() * 10).toFixed(2) : 
        Math.floor(Math.random() * 100000).toString(),
      sql_expression: `SELECT value FROM key_metrics WHERE metric = '${variable}'`,
      production_sql_expression: `SELECT value FROM key_metrics WHERE metric = '${variable}'`,
      table_name: 'key_metrics',
      last_updated: new Date().toISOString()
    });
    id++;
  });

  // Site Distribution
  targetStructure['Site Distribution'].locations.forEach(location => {
    newData.push({
      id: id.toString(),
      name: `Site Distribution - ${location}`,
      chart_group: 'Site Distribution',
      variable_name: 'Value',
      category: location,
      server_name: 'P21',
      value: Math.floor(Math.random() * 100).toString(),
      sql_expression: `SELECT percentage FROM site_distribution WHERE location = '${location}'`,
      production_sql_expression: `SELECT percentage FROM site_distribution WHERE location = '${location}'`,
      table_name: 'site_distribution',
      last_updated: new Date().toISOString()
    });
    id++;
  });

  // POR Overview
  targetStructure['POR Overview'].variables.forEach(variable => {
    targetStructure['POR Overview'].months.forEach(month => {
      newData.push({
        id: id.toString(),
        name: `POR Overview - ${variable} - ${month}`,
        chart_group: 'POR Overview',
        variable_name: variable,
        timeframe: month,
        server_name: 'POR',
        value: variable.includes('Value') ? 
          (Math.floor(Math.random() * 1000000) / 100).toFixed(2) : 
          Math.floor(Math.random() * 100).toString(),
        sql_expression: `SELECT value FROM por_overview WHERE type = '${variable}' AND month = '${month}'`,
        production_sql_expression: `SELECT value FROM por_overview WHERE type = '${variable}' AND month = '${month}'`,
        table_name: 'por_overview',
        last_updated: new Date().toISOString()
      });
      id++;
    });
  });

  // Web Orders
  targetStructure['Web Orders'].months.forEach(month => {
    newData.push({
      id: id.toString(),
      name: `Web Orders - Orders - ${month}`,
      chart_group: 'Web Orders',
      variable_name: 'Orders',
      timeframe: month,
      server_name: 'P21',
      value: Math.floor(Math.random() * 500).toString(),
      sql_expression: `SELECT COUNT(*) FROM web_orders WHERE month = '${month}'`,
      production_sql_expression: `SELECT COUNT(*) FROM web_orders WHERE month = '${month}'`,
      table_name: 'web_orders',
      last_updated: new Date().toISOString()
    });
    id++;
  });

  return newData;
}

// Function to update database with new chart data
async function updateDatabase(newData) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          return reject(err);
        }

        // Clear existing chart data
        db.run('DELETE FROM chart_data', (err) => {
          if (err) {
            db.run('ROLLBACK');
            return reject(err);
          }

          // Prepare insert statement
          const stmt = db.prepare(`
            INSERT INTO chart_data (
              id, name, chart_group, variable_name, category, timeframe, 
              server_name, value, sql_expression, production_sql_expression, 
              table_name, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          // Insert new data
          newData.forEach(row => {
            stmt.run(
              row.id,
              row.name,
              row.chart_group,
              row.variable_name,
              row.category || null,
              row.timeframe || null,
              row.server_name,
              row.value,
              row.sql_expression,
              row.production_sql_expression,
              row.table_name,
              row.last_updated
            );
          });

          stmt.finalize();

          db.run('COMMIT', (err) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(err);
            }
            resolve();
          });
        });
      });
    });
  });
}

// Function to generate initial-data.ts file content
function generateInitialDataContent(chartData) {
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

// This file was auto-generated by the update-chart-structure.js script
// Last updated: ${timestamp}

// Chart data from the admin spreadsheet
export const initialSpreadsheetData: SpreadsheetRow[] = [
`;

  // Add each row of chart data
  chartData.forEach((row, index) => {
    content += `  {
    id: '${row.id}',
    name: '${row.name}',
    chartGroup: '${row.chart_group}',
    variableName: '${row.variable_name}',
    serverName: '${row.server_name}',
    value: '${row.value}',
    calculation: '',
    sqlExpression: \`${row.sql_expression}\`,
    productionSqlExpression: \`${row.production_sql_expression}\`,
    tableName: '${row.table_name}'${row.timeframe ? `,
    timeframe: '${row.timeframe}'` : ''}${row.category ? `,
    category: '${row.category}'` : ''}${row.last_updated ? `,
    lastUpdated: '${row.last_updated}'` : ''}
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

  return content;
}

// Function to update the initial-data.ts file
async function updateInitialDataFile(chartData) {
  const content = generateInitialDataContent(chartData);
  
  try {
    fs.writeFileSync(initialDataPath, content);
    console.log(`Successfully updated ${initialDataPath}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${initialDataPath}: ${error.message}`);
    return false;
  }
}

// Main function to orchestrate the update process
async function updateChartStructure() {
  try {
    console.log('Generating new chart data based on target structure...');
    const newChartData = generateNewChartData();
    console.log(`Generated ${newChartData.length} rows of chart data`);
    
    console.log('Updating database...');
    await updateDatabase(newChartData);
    console.log('Database updated successfully');
    
    console.log('Updating initial-data.ts file...');
    await updateInitialDataFile(newChartData);
    
    console.log('\nSummary:');
    Object.keys(targetStructure).forEach(group => {
      const count = newChartData.filter(row => row.chart_group === group).length;
      console.log(`- ${group}: ${count}/${targetStructure[group].totalRows} rows`);
    });
    
    console.log(`\nTotal: ${newChartData.length}/174 rows`);
    console.log('\nChart structure update completed successfully!');
  } catch (error) {
    console.error(`Error during update: ${error.message}`);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error(`Error closing database: ${err.message}`);
      }
      console.log('Database connection closed');
    });
  }
}

// Run the update process
updateChartStructure();
