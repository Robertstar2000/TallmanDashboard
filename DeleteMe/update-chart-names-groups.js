// Script to update chart names and chart groups to ensure they're visible in the admin UI
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Define the mapping of Chart Names to Chart Groups based on the architecture documentation
const chartNameToGroupMapping = {
  'Key Metrics': 'Key Metrics',
  'Site Distribution': 'Site Distribution',
  'Accounts': 'Accounts',
  'Customer Metrics': 'Customer Metrics',
  'Historical Data': 'Historical Data',
  'Inventory': 'Inventory',
  'POR Overview': 'POR Overview',
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
    
    // 3. Check if chart_group column exists in chart_data table
    const columns = db.prepare('PRAGMA table_info(chart_data)').all();
    const hasChartGroupColumn = columns.some(col => col.name === 'chart_group');
    
    if (!hasChartGroupColumn) {
      console.log('Adding chart_group column to chart_data table');
      db.prepare('ALTER TABLE chart_data ADD COLUMN chart_group TEXT').run();
    }
    
    // 4. Get all chart data rows
    const rows = db.prepare('SELECT * FROM chart_data').all();
    
    console.log(`Found ${rows.length} chart data rows to process`);
    
    // 5. Update each row with the correct chart name and chart group
    let updatedCount = 0;
    for (const row of rows) {
      // Determine the correct chart group based on variable name patterns
      let chartName = row.chart_name;
      let chartGroup = null;
      
      // Check if the variable name contains month indicators (Jan, Feb, etc.)
      const hasMonthPattern = /Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/.test(row.variable_name);
      
      // Determine chart name and group based on variable name patterns
      if (row.variable_name && (row.variable_name.includes('Key Metric') || row.variable_name.includes('Revenue'))) {
        chartName = 'Key Metrics';
        chartGroup = 'Key Metrics';
      } else if (row.variable_name && (row.variable_name.includes('Site') || row.variable_name.includes('Columbus') || row.variable_name.includes('Addison'))) {
        chartName = 'Site Distribution';
        chartGroup = 'Site Distribution';
      } else if (row.variable_name && (row.variable_name.includes('Payable') || row.variable_name.includes('Receivable') || row.variable_name.includes('Overdue'))) {
        chartName = 'Accounts';
        chartGroup = 'Accounts';
      } else if (row.variable_name && (row.variable_name.includes('Customer') || row.variable_name.includes('Prospect'))) {
        chartName = 'Customer Metrics';
        chartGroup = 'Customer Metrics';
      } else if (row.variable_name && (row.variable_name.includes('Historical') || row.variable_name.includes('Sales History'))) {
        chartName = 'Historical Data';
        chartGroup = 'Historical Data';
      } else if (row.variable_name && (row.variable_name.includes('Inventory') || row.variable_name.includes('Stock') || row.variable_name.includes('Turnover'))) {
        chartName = 'Inventory';
        chartGroup = 'Inventory';
      } else if (row.variable_name && (row.variable_name.includes('POR') || row.variable_name.includes('Rental'))) {
        chartName = 'POR Overview';
        chartGroup = 'POR Overview';
      } else if (row.variable_name && row.variable_name.includes('Open Order')) {
        chartName = 'Open Orders';
        chartGroup = 'Open Orders';
      } else if (row.variable_name && (row.variable_name.includes('Daily') || row.variable_name.includes('Day'))) {
        chartName = 'Daily Orders';
        chartGroup = 'Daily Orders';
      } else if (row.variable_name && (row.variable_name.includes('AR') || row.variable_name.includes('Aging'))) {
        chartName = 'AR Aging';
        chartGroup = 'AR Aging';
      } else {
        // Default to using the existing chart name if no pattern matches
        if (chartName && chartNameToGroupMapping[chartName]) {
          chartGroup = chartNameToGroupMapping[chartName];
        } else {
          // If chart name doesn't match any known group, default to Key Metrics
          chartName = 'Key Metrics';
          chartGroup = 'Key Metrics';
        }
      }
      
      // Update the row with the new chart name and chart group
      if (chartName && chartGroup) {
        db.prepare(`
          UPDATE chart_data 
          SET chart_name = ?, 
              chart_group = ?
          WHERE id = ?
        `).run(chartName, chartGroup, row.id);
        updatedCount++;
      }
    }
    
    // 6. Update the AdminClient.tsx to ensure it's displaying chart groups correctly
    console.log('Checking for missing chart names or groups...');
    
    // Get all rows after updates
    const updatedRows = db.prepare('SELECT * FROM chart_data').all();
    
    // Log chart names and groups for verification
    console.log('Chart Names and Groups after update:');
    updatedRows.forEach(row => {
      console.log(`ID: ${row.id}, Chart Name: ${row.chart_name}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
    });
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    console.log(`Successfully updated ${updatedCount} rows with correct chart names and groups`);
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
