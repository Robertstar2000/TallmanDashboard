// Script to fix Web Orders variable names in the database
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

try {
  // Start a transaction
  db.prepare('BEGIN TRANSACTION').run();

  // Check the current state of Web Orders data
  const webOrdersData = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
  console.log(`Found ${webOrdersData.length} Web Orders rows`);
  
  // Count by variable name
  const ordersCount = webOrdersData.filter(row => row.variable_name === 'Orders Count').length;
  const revenue = webOrdersData.filter(row => row.variable_name === 'Revenue').length;
  console.log(`Orders Count rows: ${ordersCount}, Revenue rows: ${revenue}`);

  // Update variable names for rows with numeric IDs (64-75) to "Orders Count"
  const updateOrdersResult = db.prepare("UPDATE chart_data SET variable_name = 'Orders Count' WHERE chart_name = 'Web Orders' AND id IN ('64','65','66','67','68','69','70','71','72','73','74','75')").run();
  console.log(`Updated ${updateOrdersResult.changes} rows to have variable_name = 'Orders Count'`);

  // Verify the update
  const verifyRows = db.prepare("SELECT id, chart_name, variable_name FROM chart_data WHERE chart_name = 'Web Orders'").all();
  const updatedOrdersCount = verifyRows.filter(row => row.variable_name === 'Orders Count').length;
  const updatedRevenue = verifyRows.filter(row => row.variable_name === 'Revenue').length;
  
  console.log(`After update: Found ${verifyRows.length} Web Orders rows`);
  console.log(`Orders Count rows: ${updatedOrdersCount}, Revenue rows: ${updatedRevenue}`);

  // Commit the transaction
  db.prepare('COMMIT').run();
  console.log('Web Orders variable names fix completed successfully');
  
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error fixing Web Orders variable names:', error);
} finally {
  // Close the database
  db.close();
}
