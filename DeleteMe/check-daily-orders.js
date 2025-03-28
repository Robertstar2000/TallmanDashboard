// Script to check Daily Orders data in the database
const Database = require('better-sqlite3');
const path = require('path');

// Open the database
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');
console.log(`Opening database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  // Check the current state of Daily Orders data
  const dailyOrdersData = db.prepare("SELECT id, chart_name, variable_name, value FROM chart_data WHERE chart_name = 'Daily Orders' ORDER BY id").all();
  console.log(`Found ${dailyOrdersData.length} Daily Orders rows`);
  
  if (dailyOrdersData.length > 0) {
    console.log("\nDaily Orders Data:");
    console.log("ID\tVariable Name\t\tValue");
    console.log("--\t------------\t\t-----");
    dailyOrdersData.forEach(row => {
      console.log(`${row.id}\t${row.variable_name || 'NULL'}\t\t${row.value}`);
    });
  }
  
  // Log the raw data structure from the database for debugging
  console.log("\nRaw Data Structure (first row):");
  const columnInfo = db.prepare("PRAGMA table_info(chart_data)").all();
  console.log("Table columns:", columnInfo.map(col => col.name).join(", "));
  
  // Get all data for debugging
  const allData = db.prepare("SELECT * FROM chart_data LIMIT 1").all();
  if (allData.length > 0) {
    console.log("\nSample Row Structure:");
    const sampleRow = allData[0];
    Object.keys(sampleRow).forEach(key => {
      console.log(`${key}: ${sampleRow[key]}`);
    });
  }
  
} catch (error) {
  console.error('Error checking Daily Orders data:', error);
} finally {
  // Close the database
  db.close();
}
