// Script to fix database initialization with unique IDs
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory: ${dataDir}`);
}

// Delete existing database if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Deleted existing database: ${dbPath}`);
}

// Create a new database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log(`Connected to database: ${dbPath}`);
});

// Initialize the database tables
function initializeDatabaseTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      try {
        // Create chart_data table
        db.run(`
          CREATE TABLE IF NOT EXISTS chart_data (
            id TEXT PRIMARY KEY,
            chart_group TEXT,
            variable_name TEXT,
            serverName TEXT,
            db_table_name TEXT,
            sql_expression TEXT,
            production_sql_expression TEXT,
            value TEXT,
            transformer TEXT,
            last_updated TEXT
          )
        `);

        // Create chart_group_settings table
        db.run(`
          CREATE TABLE IF NOT EXISTS chart_group_settings (
            id TEXT PRIMARY KEY,
            name TEXT,
            display_order INTEGER,
            is_visible INTEGER,
            settings TEXT
          )
        `);

        // Create server_config table
        db.run(`
          CREATE TABLE IF NOT EXISTS server_config (
            id TEXT PRIMARY KEY,
            name TEXT,
            host TEXT,
            port INTEGER,
            username TEXT,
            password TEXT,
            database TEXT,
            is_active INTEGER,
            connection_type TEXT
          )
        `);

        console.log('Database tables created successfully');
        resolve();
      } catch (error) {
        console.error('Error creating database tables:', error);
        reject(error);
      }
    });
  });
}

// Define the chart group structure based on requirements
const chartGroups = [
  {
    name: 'AR Aging',
    variables: ['Amount Due'],
    steps: ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
    serverName: 'P21',
    tableName: 'ar_aging',
    calculation: 'number'
  },
  {
    name: 'Accounts',
    variables: ['Payable', 'Receivable', 'Overdue'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'accounts',
    calculation: 'number'
  },
  {
    name: 'Customer Metrics',
    variables: ['New Customers', 'Prospects'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'customers',
    calculation: 'number'
  },
  {
    name: 'Daily Orders',
    variables: ['Orders'],
    steps: ['Today', 'Yesterday', 'Day-2', 'Day-3', 'Day-4', 'Day-5', 'Day-6'],
    serverName: 'P21',
    tableName: 'daily_orders',
    calculation: 'number'
  },
  {
    name: 'Historical Data',
    variables: ['P21', 'POR', 'Total'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'historical_data',
    calculation: 'number'
  },
  {
    name: 'Inventory',
    variables: ['In Stock', 'On Order'],
    steps: ['Columbus', 'Addison', 'Lake City', 'Warehouse'],
    serverName: 'P21',
    tableName: 'inventory',
    calculation: 'number'
  },
  {
    name: 'Key Metrics',
    variables: ['Value'],
    steps: [
      'Total Orders', 'Open Orders', 'Shipped Orders', 
      'Total Sales', 'Average Order Value', 'Order Fill Rate', 'On-Time Delivery'
    ],
    serverName: 'P21',
    tableName: 'key_metrics',
    calculation: 'number'
  },
  {
    name: 'Site Distribution',
    variables: ['Inventory'],
    steps: ['Columbus', 'Addison', 'Lake City'],
    serverName: 'P21',
    tableName: 'site_distribution',
    calculation: 'number'
  },
  {
    name: 'POR Overview',
    variables: ['New Rentals', 'Open Rentals', 'Rental Value'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'POR',
    tableName: 'por_overview',
    calculation: 'number'
  },
  {
    name: 'Web Orders',
    variables: ['Orders'],
    steps: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    serverName: 'P21',
    tableName: 'web_orders',
    calculation: 'number'
  }
];

// Function to generate SQL expressions based on chart group, variable, and step
function generateSqlExpression(chartGroup, variable, step, serverName) {
  // Default SQL expressions based on chart group and server
  if (serverName === 'P21') {
    // P21 SQL syntax
    switch (chartGroup) {
      case 'AR Aging':
        return `SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = '${step}'`;
      
      case 'Accounts':
        return `SELECT SUM(amount) as value FROM dbo.${variable.toLowerCase()}_accounts WITH (NOLOCK) WHERE MONTH(transaction_date) = ${getMonthNumber(step)} AND YEAR(transaction_date) = YEAR(GETDATE())`;
      
      case 'Customer Metrics':
        if (variable === 'New Customers') {
          return `SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(created_date) = ${getMonthNumber(step)} AND YEAR(created_date) = YEAR(GETDATE())`;
        } else { // Prospects
          return `SELECT COUNT(*) as value FROM dbo.prospect WITH (NOLOCK) WHERE MONTH(created_date) = ${getMonthNumber(step)} AND YEAR(created_date) = YEAR(GETDATE())`;
        }
      
      case 'Daily Orders':
        const dayOffset = getDayOffset(step);
        return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date = DATEADD(day, -${dayOffset}, CAST(GETDATE() AS date))`;
      
      case 'Historical Data':
        if (variable === 'P21') {
          return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = ${getMonthNumber(step)} AND YEAR(order_date) = YEAR(GETDATE())`;
        } else if (variable === 'POR') {
          return `SELECT 0 as value`; // Placeholder for POR data in P21
        } else { // Total
          return `SELECT 0 as value`; // Placeholder for Total calculation
        }
      
      case 'Inventory':
        return `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = '${getWarehouseId(step)}' AND ${variable === 'On Order' ? 'qty_on_order' : 'qty_on_hand'} > 0`;
      
      case 'Key Metrics':
        switch (step) {
          case 'Total Orders':
            return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
          case 'Open Orders':
            return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = 'Open'`;
          case 'Shipped Orders':
            return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_status = 'Shipped' AND ship_date >= DATEADD(day, -30, GETDATE())`;
          case 'Total Sales':
            return `SELECT SUM(order_amt) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
          case 'Average Order Value':
            return `SELECT AVG(order_amt) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())`;
          case 'Order Fill Rate':
            return `SELECT CAST(COUNT(CASE WHEN line_status = 'Shipped' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as DECIMAL(10,2)) as value FROM dbo.oe_line WITH (NOLOCK) WHERE created_date >= DATEADD(day, -30, GETDATE())`;
          case 'On-Time Delivery':
            return `SELECT CAST(COUNT(CASE WHEN ship_date <= promised_date THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as DECIMAL(10,2)) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE ship_date IS NOT NULL AND order_date >= DATEADD(day, -30, GETDATE())`;
          default:
            return `SELECT 0 as value`;
        }
      
      case 'Site Distribution':
        return `SELECT SUM(qty_on_hand) as value FROM dbo.item_warehouse WITH (NOLOCK) WHERE warehouse_id = '${getWarehouseId(step)}'`;
      
      case 'Web Orders':
        return `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'Web' AND MONTH(order_date) = ${getMonthNumber(step)} AND YEAR(order_date) = YEAR(GETDATE())`;
      
      default:
        return `SELECT 0 as value`;
    }
  } else if (serverName === 'POR') {
    // POR SQL syntax (MS Access/Jet SQL)
    switch (chartGroup) {
      case 'POR Overview':
        if (variable === 'New Rentals') {
          return `SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        } else if (variable === 'Open Rentals') {
          return `SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        } else { // Rental Value
          return `SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        }
      
      case 'Historical Data':
        if (variable === 'POR') {
          return `SELECT Count(*) as value FROM Rentals WHERE Month(CreatedDate) = ${getMonthNumber(step)} AND Year(CreatedDate) = Year(Date())`;
        } else {
          return `SELECT 0 as value`; // Placeholder for non-POR data
        }
      
      default:
        return `SELECT 0 as value`;
    }
  }
  
  return `SELECT 0 as value`; // Default fallback
}

// Helper function to get month number from month name
function getMonthNumber(monthName) {
  const months = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
  };
  return months[monthName] || 1;
}

// Helper function to get day offset from day name
function getDayOffset(dayName) {
  const days = {
    'Today': 0, 'Yesterday': 1, 'Day-2': 2, 'Day-3': 3, 'Day-4': 4, 'Day-5': 5, 'Day-6': 6
  };
  return days[dayName] || 0;
}

// Helper function to get warehouse ID from location name
function getWarehouseId(locationName) {
  const locations = {
    'Columbus': 'COL', 'Addison': 'ADD', 'Lake City': 'LKC', 'Warehouse': 'WHS'
  };
  return locations[locationName] || 'MAIN';
}

// Generate all chart data rows with unique IDs
function generateChartData() {
  let allRows = [];
  let currentId = 1;
  
  // For each chart group
  chartGroups.forEach(group => {
    // For each step (e.g., month, day, location)
    group.steps.forEach(step => {
      // For each variable (e.g., Payable, Receivable)
      group.variables.forEach(variable => {
        // Create a row for this combination
        const sqlExpression = generateSqlExpression(group.name, variable, step, group.serverName);
        
        allRows.push({
          id: currentId.toString(),
          name: `${group.name} - ${step} - ${variable}`,
          chartName: group.name,
          chartGroup: group.name,
          variableName: variable === 'Value' ? step : `${variable} ${step}`,
          serverName: group.serverName,
          value: "0",
          tableName: group.tableName,
          calculation: group.calculation,
          sqlExpression: sqlExpression,
          productionSqlExpression: sqlExpression,
          lastUpdated: new Date().toISOString()
        });
        
        currentId++;
      });
    });
  });
  
  return allRows;
}

// Import chart data into the database
async function importChartData() {
  try {
    // Generate chart data with unique IDs
    const chartData = generateChartData();
    console.log(`Generated ${chartData.length} chart data rows`);
    
    // Insert chart data into the database
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        try {
          const stmt = db.prepare(`
            INSERT INTO chart_data (
              id, chart_group, variable_name, serverName, db_table_name, 
              sql_expression, production_sql_expression, value, transformer, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          chartData.forEach(row => {
            stmt.run(
              row.id,
              row.chartGroup || '',
              row.variableName || '',
              row.serverName || 'P21',
              row.tableName || '',
              row.sqlExpression || '',
              row.productionSqlExpression || row.sqlExpression || '',
              row.value || '0',
              row.calculation || 'number',
              row.lastUpdated || new Date().toISOString()
            );
          });
          
          stmt.finalize();
          console.log(`Imported ${chartData.length} chart data rows successfully`);
          resolve();
        } catch (error) {
          console.error('Error importing chart data:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error generating chart data:', error);
    throw error;
  }
}

// Import chart group settings
async function importChartGroupSettings() {
  try {
    // Define chart group settings
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
    
    // Insert chart group settings into the database
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        try {
          const stmt = db.prepare(`
            INSERT INTO chart_group_settings (
              id, name, display_order, is_visible, settings
            ) VALUES (?, ?, ?, ?, ?)
          `);
          
          chartGroupSettings.forEach(group => {
            stmt.run(
              group.id,
              group.name,
              group.display_order,
              group.is_visible,
              JSON.stringify(group.settings)
            );
          });
          
          stmt.finalize();
          console.log(`Imported ${chartGroupSettings.length} chart group settings successfully`);
          resolve();
        } catch (error) {
          console.error('Error importing chart group settings:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error defining chart group settings:', error);
    throw error;
  }
}

// Import server configurations
async function importServerConfigs() {
  try {
    // Define server configurations
    const serverConfigs = [
      {
        id: '1',
        name: 'P21',
        host: 'localhost',
        port: 1433,
        username: 'sa',
        password: 'P@ssw0rd',
        database: 'P21',
        is_active: 1,
        connection_type: 'sqlserver'
      },
      {
        id: '2',
        name: 'POR',
        host: 'localhost',
        port: 0,
        username: 'admin',
        password: '',
        database: 'C:\\POR\\PORData.mdb',
        is_active: 1,
        connection_type: 'access'
      }
    ];
    
    // Insert server configurations into the database
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        try {
          const stmt = db.prepare(`
            INSERT INTO server_config (
              id, name, host, port, username, password, database, is_active, connection_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          serverConfigs.forEach(config => {
            stmt.run(
              config.id,
              config.name,
              config.host,
              config.port,
              config.username,
              config.password,
              config.database,
              config.is_active,
              config.connection_type
            );
          });
          
          stmt.finalize();
          console.log(`Imported ${serverConfigs.length} server configurations successfully`);
          resolve();
        } catch (error) {
          console.error('Error importing server configurations:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error defining server configurations:', error);
    throw error;
  }
}

// Function to get all chart groups with their counts
function getChartGroupCounts() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT chart_group, COUNT(*) as count 
      FROM chart_data 
      WHERE chart_group IS NOT NULL AND chart_group != "" 
      GROUP BY chart_group 
      ORDER BY chart_group
    `, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Function to verify chart group counts
async function verifyChartGroupCounts() {
  try {
    // Expected counts based on requirements
    const expectedCounts = {
      'AR Aging': 5,
      'Accounts': 36,
      'Customer Metrics': 24,
      'Daily Orders': 7,
      'Historical Data': 36,
      'Inventory': 8,
      'Key Metrics': 7,
      'Site Distribution': 3,
      'POR Overview': 36,
      'Web Orders': 12
    };
    
    // Get all chart groups with their counts
    const chartGroupCounts = await getChartGroupCounts();
    
    console.log('\nChart Group Analysis:');
    console.log('====================');
    
    // Convert to an object for easier comparison
    const actualCounts = {};
    chartGroupCounts.forEach(row => {
      actualCounts[row.chart_group] = row.count;
    });
    
    // Print results
    console.log('\nChart Group Counts:');
    console.log('------------------');
    for (const group in expectedCounts) {
      const actual = actualCounts[group] || 0;
      const expected = expectedCounts[group];
      const status = actual === 0 ? 'MISSING' : 
                    actual === expected ? 'OK' : 
                    actual < expected ? `MISSING ${expected - actual} ROWS` : 
                    `EXTRA ${actual - expected} ROWS`;
      
      console.log(`${group.padEnd(20)}: ${actual.toString().padStart(3)}/${expected.toString().padStart(3)} - ${status}`);
    }
    
    // Total row counts
    const totalExpected = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0);
    const totalActual = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal expected rows: ${totalExpected}`);
    console.log(`Total actual rows: ${totalActual}`);
    
    // Return true if all counts match
    return Object.keys(expectedCounts).every(group => 
      actualCounts[group] === expectedCounts[group]
    );
  } catch (error) {
    console.error('Error verifying chart group counts:', error);
    return false;
  }
}

// Main function to initialize and verify the database
async function main() {
  try {
    // Initialize database tables
    await initializeDatabaseTables();
    
    // Import chart data
    await importChartData();
    
    // Import chart group settings
    await importChartGroupSettings();
    
    // Import server configurations
    await importServerConfigs();
    
    // Verify chart group counts
    const allCountsMatch = await verifyChartGroupCounts();
    
    if (allCountsMatch) {
      console.log('\nSUCCESS: All chart groups have the correct number of rows!');
    } else {
      console.log('\nWARNING: Some chart groups have incorrect row counts. Please check the details above.');
    }
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        return;
      }
      console.log('\nDatabase connection closed');
    });
  }
}

// Run the main function
main();
