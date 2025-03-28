// Simple script to check database structure
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Checking database at: ${dbPath}`);

try {
  // Open the database
  const db = sqlite3(dbPath);
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log("\nTables in database:");
  tables.forEach(t => console.log(`- ${t.name}`));
  
  // Check chart_data table columns
  if (tables.some(t => t.name === 'chart_data')) {
    console.log("\nColumns in chart_data table:");
    const columns = db.prepare("PRAGMA table_info(chart_data)").all();
    columns.forEach(c => console.log(`- ${c.name} (${c.type})`));
    
    // Check for production_sql_expression column
    const hasProdSqlExpr = columns.some(c => c.name === 'production_sql_expression');
    console.log(`\nHas production_sql_expression column: ${hasProdSqlExpr ? 'Yes' : 'No'}`);
    
    // Get a sample row
    console.log("\nSample row from chart_data:");
    const sampleRow = db.prepare("SELECT * FROM chart_data LIMIT 1").get();
    if (sampleRow) {
      Object.keys(sampleRow).forEach(key => {
        const value = sampleRow[key];
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        console.log(`- ${key}: ${displayValue}`);
      });
    } else {
      console.log("No rows found in chart_data table");
    }
  } else {
    console.log("chart_data table not found in database");
  }
  
  // Close the database
  db.close();
  console.log("\nCheck complete");
} catch (error) {
  console.error("Error checking database:", error);
}
