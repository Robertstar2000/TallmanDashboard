// Script to initialize the database with complete chart data and verify row counts
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database file path
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'dashboard.db');

// Expected counts based on requirements
const expectedCounts = {
  'AR Aging': 5, // 5 buckets with one variable
  'Accounts': 36, // 3 variables for 12 months
  'Customer Metrics': 24, // 2 variables for 12 months
  'Daily Orders': 7, // 1 variable for 7 days
  'Historical Data': 36, // 3 variables for 12 months
  'Inventory': 8, // 2 variables for 4 departments
  'Key Metrics': 7, // 7 separate metrics
  'Site Distribution': 3, // 1 value for 3 locations
  'POR Overview': 36, // 3 variables for 12 months
  'Web Orders': 12, // 1 variable for 12 months
};

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

// Import the chart data from the complete-chart-data.ts file
async function importChartData() {
  try {
    // Read the complete-chart-data.ts file
    const filePath = path.join(__dirname, 'lib', 'db', 'complete-chart-data.ts');
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract the JSON data from the TypeScript file
    const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = ';
    const endMarker = ';\n\n// Export the combined data';
    
    const startIndex = fileContent.indexOf(startMarker) + startMarker.length;
    const endIndex = fileContent.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Could not find chart data in the file');
    }
    
    const jsonString = fileContent.substring(startIndex, endIndex);
    const chartData = JSON.parse(jsonString);
    
    console.log(`Found ${chartData.length} chart data rows to import`);
    
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
    console.error('Error reading chart data file:', error);
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
    // Get all chart groups with their counts
    const chartGroupCounts = await getChartGroupCounts();
    
    console.log('\nChart Group Analysis:');
    console.log('====================');
    
    // Convert to an object for easier comparison
    const actualCounts = {};
    chartGroupCounts.forEach(row => {
      actualCounts[row.chart_group] = row.count;
    });
    
    // Check for missing chart groups
    const missingGroups = [];
    for (const group in expectedCounts) {
      if (!actualCounts[group]) {
        missingGroups.push(group);
      }
    }
    
    // Check for unexpected chart groups
    const unexpectedGroups = [];
    for (const group in actualCounts) {
      if (!expectedCounts[group]) {
        unexpectedGroups.push(group);
      }
    }
    
    // Check for mismatched counts
    const mismatchedGroups = [];
    for (const group in actualCounts) {
      if (expectedCounts[group] && actualCounts[group] !== expectedCounts[group]) {
        mismatchedGroups.push({
          group,
          actual: actualCounts[group],
          expected: expectedCounts[group],
          difference: actualCounts[group] - expectedCounts[group]
        });
      }
    }
    
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
    
    // Summary
    console.log('\nSummary:');
    console.log('--------');
    console.log(`Total expected chart groups: ${Object.keys(expectedCounts).length}`);
    console.log(`Total actual chart groups: ${Object.keys(actualCounts).length}`);
    console.log(`Missing chart groups: ${missingGroups.length}`);
    console.log(`Unexpected chart groups: ${unexpectedGroups.length}`);
    console.log(`Mismatched row counts: ${mismatchedGroups.length}`);
    
    // Total row counts
    const totalExpected = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0);
    const totalActual = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
    console.log(`\nTotal expected rows: ${totalExpected}`);
    console.log(`Total actual rows: ${totalActual}`);
    console.log(`Difference: ${totalActual - totalExpected} rows`);
    
    // Details for missing groups
    if (missingGroups.length > 0) {
      console.log('\nMissing Chart Groups:');
      console.log('--------------------');
      missingGroups.forEach(group => {
        console.log(`${group.padEnd(20)}: Expected ${expectedCounts[group]} rows`);
      });
    }
    
    // Details for unexpected groups
    if (unexpectedGroups.length > 0) {
      console.log('\nUnexpected Chart Groups:');
      console.log('----------------------');
      unexpectedGroups.forEach(group => {
        console.log(`${group.padEnd(20)}: ${actualCounts[group]} rows`);
      });
    }
    
    // Details for mismatched counts
    if (mismatchedGroups.length > 0) {
      console.log('\nMismatched Row Counts:');
      console.log('--------------------');
      mismatchedGroups.forEach(({ group, actual, expected, difference }) => {
        console.log(`${group.padEnd(20)}: ${actual} rows (Expected: ${expected}, Difference: ${difference > 0 ? '+' : ''}${difference})`);
      });
    }
    
    // Return true if all counts match
    return missingGroups.length === 0 && unexpectedGroups.length === 0 && mismatchedGroups.length === 0;
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
