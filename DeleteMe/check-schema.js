// Script to check the database schema
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Connecting to database at ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the database');
});

// Get the schema of the chart_data table
db.all(`PRAGMA table_info(chart_data)`, [], (err, rows) => {
  if (err) {
    console.error('Error querying database schema:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('Chart Data Table Schema:');
  console.log(rows);
  
  // Close the database
  db.close();
});
