// Initialize the database with required chart groups
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Database path
const dbPath = path.join(dataDir, 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Create tables if they don't exist
db.serialize(() => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create chart_data table
  db.run(`
    CREATE TABLE IF NOT EXISTS chart_data (
      id TEXT PRIMARY KEY,
      chart_group TEXT,
      variable_name TEXT,
      server_name TEXT,
      db_table_name TEXT,
      sql_expression TEXT,
      production_sql_expression TEXT,
      value TEXT,
      transformer TEXT,
      last_updated TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating chart_data table:', err.message);
    } else {
      console.log('chart_data table created or already exists');
    }
  });

  // Create chart_groups table
  db.run(`
    CREATE TABLE IF NOT EXISTS chart_groups (
      id TEXT PRIMARY KEY,
      name TEXT,
      display_order INTEGER,
      is_visible INTEGER DEFAULT 1,
      settings TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating chart_groups table:', err.message);
    } else {
      console.log('chart_groups table created or already exists');
    }
  });

  // Create server_config table
  db.run(`
    CREATE TABLE IF NOT EXISTS server_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_name TEXT,
      host TEXT,
      port INTEGER,
      database TEXT,
      username TEXT,
      password TEXT,
      config TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating server_config table:', err.message);
    } else {
      console.log('server_config table created or already exists');
    }
  });

  // Insert or update chart groups
  const chartGroups = [
    { id: 'kg1', name: 'Key Metrics', display_order: 1, is_visible: 1, settings: '{}' },
    { id: 'kg2', name: 'Site Distribution', display_order: 2, is_visible: 1, settings: '{}' },
    { id: 'kg3', name: 'Accounts', display_order: 3, is_visible: 1, settings: '{}' },
    { id: 'kg4', name: 'Customer Metrics', display_order: 4, is_visible: 1, settings: '{}' },
    { id: 'kg5', name: 'Historical Data', display_order: 5, is_visible: 1, settings: '{}' },
    { id: 'kg6', name: 'Inventory', display_order: 6, is_visible: 1, settings: '{}' },
    { id: 'kg7', name: 'POR Overview', display_order: 7, is_visible: 1, settings: '{}' },
    { id: 'kg8', name: 'Daily Orders', display_order: 8, is_visible: 1, settings: '{}' },
    { id: 'kg9', name: 'AR Aging', display_order: 9, is_visible: 1, settings: '{}' },
    { id: 'kg10', name: 'Web Orders', display_order: 10, is_visible: 1, settings: '{}' }
  ];

  // Prepare and run insert statements for chart groups
  const insertChartGroup = db.prepare(`
    INSERT OR REPLACE INTO chart_groups (id, name, display_order, is_visible, settings)
    VALUES (?, ?, ?, ?, ?)
  `);

  chartGroups.forEach(group => {
    insertChartGroup.run(
      group.id,
      group.name,
      group.display_order,
      group.is_visible,
      group.settings
    );
  });

  insertChartGroup.finalize();
  console.log('Chart groups inserted or updated');

  // Load initial data from the initial-data.ts file
  try {
    // We can't directly import the TypeScript file, so we'll use a simple approach
    // to extract the data array
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let initialDataContent = fs.readFileSync(initialDataPath, 'utf8');
    
    console.log('Checking if chart_data table has data...');
    db.get('SELECT COUNT(*) as count FROM chart_data', (err, row) => {
      if (err) {
        console.error('Error checking chart_data count:', err.message);
        return;
      }
      
      if (row.count === 0) {
        console.log('chart_data table is empty, inserting sample data...');
        
        // Insert sample data for each chart group
        const sampleData = [];
        
        // AR Aging - 5 rows
        sampleData.push(createSampleRow('ar1', 'AR Aging', 'Current', '1000'));
        sampleData.push(createSampleRow('ar2', 'AR Aging', '1-30 Days', '800'));
        sampleData.push(createSampleRow('ar3', 'AR Aging', '31-60 Days', '600'));
        sampleData.push(createSampleRow('ar4', 'AR Aging', '61-90 Days', '400'));
        sampleData.push(createSampleRow('ar5', 'AR Aging', '90+ Days', '200'));
        
        // Accounts - 3 variables for Jan
        sampleData.push(createSampleRow('acc1', 'Accounts', 'Payable (Jan)', '5000'));
        sampleData.push(createSampleRow('acc2', 'Accounts', 'Receivable (Jan)', '6000'));
        sampleData.push(createSampleRow('acc3', 'Accounts', 'Overdue (Jan)', '1000'));
        
        // Customer Metrics - 2 variables for Jan
        sampleData.push(createSampleRow('cm1', 'Customer Metrics', 'New (Jan)', '50'));
        sampleData.push(createSampleRow('cm2', 'Customer Metrics', 'Prospects (Jan)', '100'));
        
        // Daily Orders - 7 days
        sampleData.push(createSampleRow('do1', 'Daily Orders', 'Today', '25'));
        sampleData.push(createSampleRow('do2', 'Daily Orders', 'Yesterday', '22'));
        sampleData.push(createSampleRow('do3', 'Daily Orders', 'Day-2', '20'));
        sampleData.push(createSampleRow('do4', 'Daily Orders', 'Day-3', '18'));
        sampleData.push(createSampleRow('do5', 'Daily Orders', 'Day-4', '23'));
        sampleData.push(createSampleRow('do6', 'Daily Orders', 'Day-5', '19'));
        sampleData.push(createSampleRow('do7', 'Daily Orders', 'Day-6', '21'));
        
        // Historical Data - 3 variables for Jan
        sampleData.push(createSampleRow('hd1', 'Historical Data', 'P21 (Jan)', '10000'));
        sampleData.push(createSampleRow('hd2', 'Historical Data', 'POR (Jan)', '5000'));
        sampleData.push(createSampleRow('hd3', 'Historical Data', 'Total {P21+POR} (Jan)', '15000'));
        
        // Inventory - 2 variables for 4 departments
        sampleData.push(createSampleRow('inv1', 'Inventory', 'In Stock (100)', '500'));
        sampleData.push(createSampleRow('inv2', 'Inventory', 'On Order (100)', '200'));
        sampleData.push(createSampleRow('inv3', 'Inventory', 'In Stock (101)', '600'));
        sampleData.push(createSampleRow('inv4', 'Inventory', 'On Order (101)', '300'));
        sampleData.push(createSampleRow('inv5', 'Inventory', 'In Stock (102)', '400'));
        sampleData.push(createSampleRow('inv6', 'Inventory', 'On Order (102)', '150'));
        sampleData.push(createSampleRow('inv7', 'Inventory', 'In Stock (107)', '700'));
        sampleData.push(createSampleRow('inv8', 'Inventory', 'On Order (107)', '250'));
        
        // Key Metrics - 7 metrics
        sampleData.push(createSampleRow('km1', 'Key Metrics', 'Total Sales', '50000'));
        sampleData.push(createSampleRow('km2', 'Key Metrics', 'Profit Margin', '22.5'));
        sampleData.push(createSampleRow('km3', 'Key Metrics', 'Customer Count', '1250'));
        sampleData.push(createSampleRow('km4', 'Key Metrics', 'Average Order Value', '425'));
        sampleData.push(createSampleRow('km5', 'Key Metrics', 'Return Rate', '3.2'));
        sampleData.push(createSampleRow('km6', 'Key Metrics', 'Inventory Turnover', '4.5'));
        sampleData.push(createSampleRow('km7', 'Key Metrics', 'Web Orders', '325'));
        
        // POR Overview - 3 variables for Jan
        sampleData.push(createSampleRow('por1', 'POR Overview', 'New Rentals (Jan)', '45'));
        sampleData.push(createSampleRow('por2', 'POR Overview', 'Open Rentals (Jan)', '120'));
        sampleData.push(createSampleRow('por3', 'POR Overview', 'Rental Value (Jan)', '15000'));
        
        // Site Distribution - 3 locations
        sampleData.push(createSampleRow('sd1', 'Site Distribution', 'Columbus', '45'));
        sampleData.push(createSampleRow('sd2', 'Site Distribution', 'Addison', '30'));
        sampleData.push(createSampleRow('sd3', 'Site Distribution', 'Lake City', '25'));
        
        // Web Orders - 1 variable for Jan
        sampleData.push(createSampleRow('wo1', 'Web Orders', 'Orders (Jan)', '125'));
        
        // Prepare and run insert statements for sample data
        const insertSampleData = db.prepare(`
          INSERT OR REPLACE INTO chart_data (
            id, chart_group, variable_name, server_name, db_table_name, 
            sql_expression, production_sql_expression, value, transformer, last_updated
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        sampleData.forEach(row => {
          insertSampleData.run(
            row.id,
            row.chart_group,
            row.variable_name,
            row.server_name,
            row.db_table_name,
            row.sql_expression,
            row.production_sql_expression,
            row.value,
            row.transformer,
            row.last_updated
          );
        });
        
        insertSampleData.finalize();
        console.log(`Inserted ${sampleData.length} sample data rows`);
      } else {
        console.log(`chart_data table already has ${row.count} rows`);
      }
    });
  } catch (error) {
    console.error('Error loading initial data:', error);
  }
});

// Helper function to create a sample row
function createSampleRow(id, chartGroup, variableName, value) {
  return {
    id,
    chart_group: chartGroup,
    variable_name: variableName,
    server_name: Math.random() > 0.5 ? 'P21' : 'POR',
    db_table_name: 'sample_table',
    sql_expression: 'SELECT 1',
    production_sql_expression: 'SELECT 1',
    value,
    transformer: '',
    last_updated: new Date().toISOString()
  };
}

// Close the database connection when done
process.on('exit', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});

// Create a cache-busting file to force a refresh of the chart data
const cacheBustFile = path.join(dataDir, 'cache-bust.txt');
fs.writeFileSync(cacheBustFile, new Date().toISOString());
console.log(`Created cache-busting file at ${cacheBustFile}`);

console.log('Database initialization complete.');
