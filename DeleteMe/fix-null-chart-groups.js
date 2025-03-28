// Script to fix null chart groups in the database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the SQLite database in the data directory
const dbPath = path.resolve(__dirname, 'data', 'dashboard.db');
console.log('Database path:', dbPath);

// Create a backup of the database
const backupPath = `${dbPath}.backup-${Date.now()}`;
fs.copyFileSync(dbPath, backupPath);
console.log(`Created database backup at ${backupPath}`);

// Chart name to chart group mapping
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

  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();

  try {
    // Get rows with null chart_group
    const nullRows = db.prepare(`
      SELECT id, chart_name, variable_name 
      FROM chart_data 
      WHERE chart_group IS NULL OR chart_group = ''
    `).all();
    
    console.log(`Found ${nullRows.length} rows with null chart_group`);
    
    // Update statement
    const updateStmt = db.prepare(`
      UPDATE chart_data 
      SET chart_group = ? 
      WHERE id = ?
    `);
    
    // Process each row
    let updatedRows = 0;
    let deletedRows = 0;
    
    for (const row of nullRows) {
      const chartName = row.chart_name;
      
      if (chartName && chartGroupMappings[chartName]) {
        // If chart_name is in our mapping, use the mapped group
        const chartGroup = chartGroupMappings[chartName];
        updateStmt.run(chartGroup, row.id);
        updatedRows++;
        console.log(`Updated row ${row.id}: chart_name="${chartName}", chart_group="${chartGroup}"`);
      } else if (chartName) {
        // If chart_name exists but not in our mapping, use chart_name as chart_group
        updateStmt.run(chartName, row.id);
        updatedRows++;
        console.log(`Updated row ${row.id}: chart_name="${chartName}", chart_group="${chartName}"`);
      } else {
        // If no chart_name, this row is likely invalid
        console.log(`Row ${row.id} has no chart_name, variable_name="${row.variable_name}"`);
        
        // We'll mark these for potential deletion
        // For safety, we're not actually deleting them in this script
        deletedRows++;
      }
    }
    
    // Commit the transaction
    db.prepare('COMMIT').run();
    
    console.log(`Updated ${updatedRows} rows with chart_group values`);
    console.log(`Identified ${deletedRows} rows that may need to be deleted (not deleted in this run)`);
    
    // Get updated counts
    const updatedCounts = db.prepare(`
      SELECT chart_group, COUNT(*) as count
      FROM chart_data
      GROUP BY chart_group
    `).all();

    console.log('\nUpdated counts by chart group:');
    updatedCounts.forEach(row => {
      console.log(`- ${row.chart_group || 'null'}: ${row.count} items`);
    });
    
  } catch (error) {
    // Rollback the transaction on error
    db.prepare('ROLLBACK').run();
    console.error('Error fixing null chart groups:', error);
  }
  
  // Close the database connection
  db.close();
  console.log('\nDatabase connection closed');
  
} catch (error) {
  console.error('Error:', error.message);
}
