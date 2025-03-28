// Script to verify Daily Orders chart data in the database
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
  // Check the current state of Daily Orders data
  const dailyOrdersData = db.prepare("SELECT id, chart_name, variable_name, value FROM chart_data WHERE chart_name = 'Daily Orders' ORDER BY id").all();
  console.log(`Found ${dailyOrdersData.length} Daily Orders rows`);
  
  if (dailyOrdersData.length === 0) {
    console.log("No Daily Orders data found. Checking if the data exists with a different chart name...");
    
    // Check for potential Daily Orders data with different chart names
    const potentialDailyOrdersData = db.prepare("SELECT id, chart_name, variable_name, value FROM chart_data WHERE id BETWEEN 56 AND 62 ORDER BY id").all();
    
    if (potentialDailyOrdersData.length > 0) {
      console.log(`Found ${potentialDailyOrdersData.length} potential Daily Orders rows with IDs between 56 and 62:`);
      console.log("\nPotential Daily Orders Data:");
      console.log("ID\tChart Name\t\tVariable Name\tValue");
      console.log("--\t----------\t\t------------\t-----");
      potentialDailyOrdersData.forEach(row => {
        console.log(`${row.id}\t${row.chart_name || 'NULL'}\t${row.variable_name || 'NULL'}\t${row.value}`);
      });
      
      // Update the chart_name for these rows
      console.log("\nUpdating chart_name to 'Daily Orders' for these rows...");
      const updateResult = db.prepare("UPDATE chart_data SET chart_name = 'Daily Orders' WHERE id BETWEEN 56 AND 62").run();
      console.log(`Updated ${updateResult.changes} rows`);
      
      // Verify the update
      const updatedData = db.prepare("SELECT id, chart_name, variable_name, value FROM chart_data WHERE chart_name = 'Daily Orders' ORDER BY id").all();
      console.log(`After update: Found ${updatedData.length} Daily Orders rows`);
    } else {
      console.log("No potential Daily Orders data found with IDs between 56 and 62.");
    }
  } else {
    // Display all Daily Orders rows for verification
    console.log("\nDaily Orders Data:");
    console.log("ID\tVariable Name\t\tValue");
    console.log("--\t------------\t\t-----");
    dailyOrdersData.forEach(row => {
      console.log(`${row.id}\t${row.variable_name || 'NULL'}\t${row.value}`);
    });
  }
  
  console.log("\nDaily Orders verification completed");
  
} catch (error) {
  console.error('Error verifying Daily Orders data:', error);
} finally {
  // Close the database
  db.close();
}
