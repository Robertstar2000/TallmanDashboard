// Script to examine the chart_data table structure
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(__dirname, 'data', 'dashboard.db');

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at: ${dbPath}`);
  process.exit(1);
}

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error opening database: ${err.message}`);
    process.exit(1);
  }
  console.log(`Connected to the database at ${dbPath}`);
});

// Get structure of chart_data table
db.all("PRAGMA table_info(chart_data)", [], (err, columns) => {
  if (err) {
    console.error(`Error getting columns: ${err.message}`);
    db.close();
    return;
  }
  
  console.log('Columns in chart_data table:');
  columns.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // Get sample data
  db.all("SELECT * FROM chart_data LIMIT 10", [], (err, rows) => {
    if (err) {
      console.error(`Error getting data: ${err.message}`);
      db.close();
      return;
    }
    
    console.log('\nSample data from chart_data:');
    if (rows.length === 0) {
      console.log('  No data');
    } else {
      rows.forEach((row, index) => {
        console.log(`\nRow ${index + 1}:`);
        Object.keys(row).forEach(key => {
          // Truncate very long values
          let value = row[key];
          if (typeof value === 'string' && value.length > 100) {
            value = value.substring(0, 100) + '...';
          }
          console.log(`  ${key}: ${value}`);
        });
      });
    }
    
    // Get count of rows
    db.get("SELECT COUNT(*) as count FROM chart_data", [], (err, result) => {
      if (err) {
        console.error(`Error getting row count: ${err.message}`);
      } else {
        console.log(`\nTotal rows in chart_data: ${result.count}`);
      }
      
      db.close(() => {
        console.log('\nDatabase connection closed.');
      });
    });
  });
});
