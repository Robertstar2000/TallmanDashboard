// Script to verify Web Orders chart data in the database
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
  // First, let's check the table schema to understand what columns are available
  const tableInfo = db.prepare("PRAGMA table_info(chart_data)").all();
  console.log("Chart Data Table Schema:");
  tableInfo.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  // Now check the current state of Web Orders data
  const webOrdersData = db.prepare("SELECT * FROM chart_data WHERE chart_name = 'Web Orders' ORDER BY id").all();
  console.log(`\nFound ${webOrdersData.length} Web Orders rows`);
  
  // Count by variable name
  const ordersCount = webOrdersData.filter(row => row.variable_name === 'Orders Count').length;
  const revenue = webOrdersData.filter(row => row.variable_name === 'Revenue').length;
  console.log(`Orders Count rows: ${ordersCount}, Revenue rows: ${revenue}`);

  // Display all Web Orders rows for verification
  console.log("\nWeb Orders Data:");
  console.log("ID\tVariable\t\tValue");
  console.log("--\t--------\t\t-----");
  webOrdersData.forEach(row => {
    console.log(`${row.id}\t${row.variable_name}\t${row.value}`);
  });
  
  console.log("\nWeb Orders verification completed");
  
} catch (error) {
  console.error('Error verifying Web Orders data:', error);
} finally {
  // Close the database
  db.close();
}
