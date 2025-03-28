// Script to check Customer Metrics and Daily Orders rows
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Check Customer Metrics rows
console.log('\nCustomer Metrics Rows:');
console.log('=====================');
db.all("SELECT id, variable_name FROM chart_data WHERE chart_group = 'Customer Metrics' ORDER BY id", (err, rows) => {
  if (err) {
    console.error('Error getting Customer Metrics rows:', err.message);
    return;
  }
  
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ID: ${row.id}, Variable: ${row.variable_name}`);
  });
  
  // Check Daily Orders rows
  console.log('\nDaily Orders Rows:');
  console.log('=================');
  db.all("SELECT id, variable_name FROM chart_data WHERE chart_group = 'Daily Orders' ORDER BY id", (err, rows) => {
    if (err) {
      console.error('Error getting Daily Orders rows:', err.message);
      closeDb();
      return;
    }
    
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Variable: ${row.variable_name}`);
    });
    
    closeDb();
  });
});

// Function to close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('\nDatabase connection closed');
    }
  });
}
