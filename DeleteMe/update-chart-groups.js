// Script to update chart groups in the database
const Database = require('better-sqlite3');
const path = require('path');

// Path to the SQLite database
const dbPath = path.resolve(__dirname, 'dashboard.db');
console.log('Database path:', dbPath);

// Define the correct chart name to chart group mappings
const chartGroupMappings = {
  'Key Metrics': 'Key Metrics',
  'Site Distribution': 'Site Distribution',
  'Accounts': 'Accounts',
  'Customer Metrics': 'Customer Metrics',
  'Customers': 'Customer Metrics',
  'Historical Data': 'Historical Data',
  'Inventory': 'Inventory',
  'POR Overview': 'POR Overview',
  'Por Overview': 'POR Overview',
  'Open Orders': 'Open Orders',
  'Orders': 'Open Orders',
  'Daily Orders': 'Daily Orders',
  'Web Orders': 'Web Orders',
  'AR Aging': 'AR Aging',
  'Ar Aging': 'AR Aging'
};

try {
  // Connect to the database
  console.log('Connecting to database...');
  const db = new Database(dbPath);
  console.log('Connected to database');

  // Check if chart_group column exists
  const columns = db.prepare('PRAGMA table_info(chart_data)').all();
  const hasChartGroupColumn = columns.some(col => col.name === 'chart_group');
  
  if (!hasChartGroupColumn) {
    console.log('Adding chart_group column to chart_data table...');
    db.prepare('ALTER TABLE chart_data ADD COLUMN chart_group TEXT').run();
    console.log('Added chart_group column');
  }

  // Get all rows from chart_data
  const rows = db.prepare('SELECT id, chart_name, chart_group FROM chart_data').all();
  console.log(`Found ${rows.length} rows in chart_data table`);

  // Update each row with the correct chart_group
  let updatedRows = 0;
  
  for (const row of rows) {
    const chartName = row.chart_name;
    let chartGroup = row.chart_group;
    
    // If chart_group is missing or doesn't match the expected mapping
    if (!chartGroup || chartGroup === '') {
      // Look up the correct chart_group from the mappings
      const mappedGroup = chartGroupMappings[chartName];
      
      if (mappedGroup) {
        // Use the mapped group if available
        chartGroup = mappedGroup;
      } else {
        // Otherwise, use the chart_name as the chart_group
        chartGroup = chartName;
      }
      
      // Update the row
      const updateStmt = db.prepare('UPDATE chart_data SET chart_group = ? WHERE id = ?');
      updateStmt.run(chartGroup, row.id);
      
      console.log(`Updated row ${row.id}: chart_name="${chartName}", chart_group="${chartGroup}"`);
      updatedRows++;
    }
  }
  
  console.log(`Updated ${updatedRows} rows with chart_group values`);
  
  // Close the database connection
  db.close();
  console.log('Database connection closed');
  
} catch (error) {
  console.error('Error:', error.message);
}
