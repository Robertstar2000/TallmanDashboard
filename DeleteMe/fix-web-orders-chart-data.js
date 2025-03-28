// Script to fix Web Orders chart data in the database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Open the database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
console.log(`Opening database at: ${dbPath}`);

// Check if database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath);

// Get the current chart data
console.log('Checking current Web Orders data...');
const currentRows = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
console.log(`Found ${currentRows.length} Web Orders rows`);

// Count by variable name
const orderCount = currentRows.filter(row => row.variable_name === 'Orders Count').length;
const revenueCount = currentRows.filter(row => row.variable_name === 'Revenue').length;
console.log(`Orders Count rows: ${orderCount}, Revenue rows: ${revenueCount}`);

// If we don't have 12 revenue rows, we need to fix it
if (revenueCount < 12) {
  console.log('Missing revenue rows. Checking for rows with missing chart_name...');
  
  // Look for rows with Web Orders in the name but no chart_name
  const missingChartNameRows = db.prepare("SELECT id, chart_name, variable_name, name FROM chart_data WHERE name LIKE 'Web Orders - Revenue%' AND (chart_name IS NULL OR chart_name = '')").all();
  console.log(`Found ${missingChartNameRows.length} rows with missing chart_name`);
  
  if (missingChartNameRows.length > 0) {
    // Fix the chart_name for these rows
    const updateStmt = db.prepare("UPDATE chart_data SET chart_name = 'Web Orders' WHERE id = ?");
    
    console.log('Updating rows with missing chart_name:');
    for (const row of missingChartNameRows) {
      console.log(`  Updating row ${row.id}: ${row.name}`);
      updateStmt.run(row.id);
    }
    
    console.log('Update complete. Verifying...');
    
    // Verify the update
    const updatedRows = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
    const updatedOrderCount = updatedRows.filter(row => row.variable_name === 'Orders Count').length;
    const updatedRevenueCount = updatedRows.filter(row => row.variable_name === 'Revenue').length;
    console.log(`After update: Orders Count rows: ${updatedOrderCount}, Revenue rows: ${updatedRevenueCount}`);
  } else {
    console.log('No rows with missing chart_name found. Checking if revenue rows exist at all...');
    
    // Check if the revenue rows exist at all
    const allRevenueRows = db.prepare("SELECT id, chart_name, variable_name, name FROM chart_data WHERE name LIKE 'Web Orders - Revenue%'").all();
    console.log(`Found ${allRevenueRows.length} rows with 'Web Orders - Revenue' in the name`);
    
    if (allRevenueRows.length === 0) {
      console.log('No revenue rows found. The database needs to be reinitialized with the updated initial-data.ts file.');
    } else {
      console.log('Revenue rows exist but may have other issues:');
      for (const row of allRevenueRows) {
        console.log(`  Row ${row.id}: ${row.name}, chart_name: ${row.chart_name}, variable_name: ${row.variable_name}`);
      }
    }
  }
} else {
  console.log('Web Orders data looks good: 12 months of Orders Count and 12 months of Revenue');
}

// Close the database
db.close();
