// Script to fix database schema and ensure chart_group column exists
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the SQLite database
const dbPath = path.resolve(__dirname, 'dashboard.db');
console.log('Database path:', dbPath);

// Create a backup of the database
const backupPath = `${dbPath}.backup-${Date.now()}`;
fs.copyFileSync(dbPath, backupPath);
console.log(`Created database backup at ${backupPath}`);

try {
  // Connect to the database
  console.log('Connecting to database...');
  const db = new Database(dbPath);
  console.log('Connected to database');

  // Check if chart_group column exists
  const columns = db.prepare('PRAGMA table_info(chart_data)').all();
  console.log('Chart_data table columns:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  const hasChartGroupColumn = columns.some(col => col.name === 'chart_group');
  
  if (!hasChartGroupColumn) {
    console.log('Adding chart_group column to chart_data table...');
    db.prepare('ALTER TABLE chart_data ADD COLUMN chart_group TEXT').run();
    console.log('Added chart_group column');
  } else {
    console.log('chart_group column already exists');
  }

  // Get all rows from chart_data
  const rows = db.prepare('SELECT id, chart_name FROM chart_data').all();
  console.log(`Found ${rows.length} rows in chart_data table`);

  // Update each row with the chart_group matching the chart_name
  let updatedRows = 0;
  
  for (const row of rows) {
    // Use chart_name as the chart_group
    const chartName = row.chart_name || '';
    
    try {
      // Update the row
      const updateStmt = db.prepare('UPDATE chart_data SET chart_group = ? WHERE id = ?');
      updateStmt.run(chartName, row.id);
      
      console.log(`Updated row ${row.id}: chart_name="${chartName}", chart_group="${chartName}"`);
      updatedRows++;
    } catch (updateError) {
      console.error(`Error updating row ${row.id}:`, updateError.message);
    }
  }
  
  console.log(`Updated ${updatedRows} rows with chart_group values`);
  
  // Verify the updates
  try {
    const verifyRows = db.prepare('SELECT id, chart_name, chart_group FROM chart_data LIMIT 5').all();
    console.log('\nSample rows after update:');
    verifyRows.forEach(row => {
      console.log(`Row ${row.id}: chart_name="${row.chart_name}", chart_group="${row.chart_group}"`);
    });
  } catch (verifyError) {
    console.error('Error verifying updates:', verifyError.message);
  }
  
  // Close the database connection
  db.close();
  console.log('Database connection closed');
  
} catch (error) {
  console.error('Error:', error.message);
}
