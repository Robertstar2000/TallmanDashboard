// Script to align Chart Names with Chart Groups and set default chart groups
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Define the mapping of Chart Names to Chart Groups
const chartNameToGroupMapping = {
  'Key Metrics': 'Key Metrics',
  'Site Distribution': 'Site Distribution',
  'Accounts': 'Accounts',
  'Customers': 'Customer Metrics',
  'Historical': 'Historical Data',
  'Inventory': 'Inventory',
  'POR': 'POR Overview',
  'Open Orders': 'Open Orders',
  'Daily Orders': 'Daily Orders',
  'AR Aging': 'AR Aging'
};

// Define default chart groups with display order
const defaultChartGroups = [
  { id: 'key_metrics', name: 'Key Metrics', display_order: 1, is_visible: 1 },
  { id: 'site_distribution', name: 'Site Distribution', display_order: 2, is_visible: 1 },
  { id: 'accounts', name: 'Accounts', display_order: 3, is_visible: 1 },
  { id: 'customer_metrics', name: 'Customer Metrics', display_order: 4, is_visible: 1 },
  { id: 'historical_data', name: 'Historical Data', display_order: 5, is_visible: 1 },
  { id: 'inventory', name: 'Inventory', display_order: 6, is_visible: 1 },
  { id: 'por_overview', name: 'POR Overview', display_order: 7, is_visible: 1 },
  { id: 'open_orders', name: 'Open Orders', display_order: 8, is_visible: 1 },
  { id: 'daily_orders', name: 'Daily Orders', display_order: 9, is_visible: 1 },
  { id: 'ar_aging', name: 'AR Aging', display_order: 10, is_visible: 1 }
];

// Path to the SQLite database
const dbPath = path.join(__dirname, 'dashboard.db');

try {
  // Connect to the database
  const db = new Database(dbPath);
  
  console.log('Connected to database:', dbPath);
  
  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // 1. First, ensure the chart_groups table exists
    const chartGroupsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='chart_groups'
    `).get();
    
    if (!chartGroupsTableExists) {
      console.log('chart_groups table does not exist, creating it...');
      db.prepare(`
        CREATE TABLE IF NOT EXISTS chart_groups (
          id TEXT PRIMARY KEY,
          name TEXT,
          display_order INTEGER,
          is_visible INTEGER DEFAULT 1,
          settings TEXT
        )
      `).run();
    }
    
    // 2. Clear existing chart groups and insert default ones
    db.prepare('DELETE FROM chart_groups').run();
    console.log('Cleared existing chart groups');
    
    // Insert default chart groups
    const insertChartGroup = db.prepare(`
      INSERT INTO chart_groups (id, name, display_order, is_visible, settings)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const group of defaultChartGroups) {
      insertChartGroup.run(
        group.id,
        group.name,
        group.display_order,
        group.is_visible,
        JSON.stringify({})
      );
    }
    
    console.log(`Inserted ${defaultChartGroups.length} default chart groups`);
    
    // 3. Get all chart data rows
    const rows = db.prepare('SELECT id, chart_name FROM chart_data').all();
    
    console.log(`Found ${rows.length} chart data rows to process`);
    
    // 4. Update each row with the aligned chart group
    let updatedCount = 0;
    for (const row of rows) {
      // Find the matching chart group based on the chart name
      let matchedGroup = null;
      
      for (const [chartNamePrefix, chartGroup] of Object.entries(chartNameToGroupMapping)) {
        if (row.chart_name.startsWith(chartNamePrefix)) {
          matchedGroup = chartGroup;
          break;
        }
      }
      
      if (matchedGroup) {
        // Update the chart name to align with the chart group
        db.prepare('UPDATE chart_data SET chart_name = ? WHERE id = ?').run(matchedGroup, row.id);
        updatedCount++;
      }
    }
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    console.log(`Successfully updated ${updatedCount} rows with aligned chart names`);
    console.log('Chart groups have been set up with default names and display order');
  } catch (error) {
    // Rollback the transaction on error
    db.prepare('ROLLBACK').run();
    console.error('Error updating chart names and groups:', error);
  }
  
  // Close the database connection
  db.close();
  
  console.log('Database connection closed');
} catch (error) {
  console.error('Error connecting to database:', error);
}
