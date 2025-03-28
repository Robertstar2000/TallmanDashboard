// Script to count the number of rows for each chart group
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory at ${dataDir}`);
}

// Database path
const dbPath = path.join(dataDir, 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Count rows by chart group
db.all("SELECT chart_group, COUNT(*) as count FROM chart_data GROUP BY chart_group ORDER BY chart_group", (err, rows) => {
  if (err) {
    console.error('Error counting rows by chart group:', err.message);
    closeDb();
    return;
  }
  
  console.log('\nChart Group Counts:');
  console.log('===================');
  
  let totalRows = 0;
  rows.forEach(row => {
    console.log(`${row.chart_group}: ${row.count} rows`);
    totalRows += row.count;
  });
  
  console.log('===================');
  console.log(`Total: ${totalRows} rows`);
  
  closeDb();
});

// Function to close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
