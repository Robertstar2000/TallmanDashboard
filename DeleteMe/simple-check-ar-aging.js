const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Opening database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
  
  // Query to check AR Aging data
  db.all("SELECT * FROM chart_data WHERE chart_group = 'AR Aging'", [], (err, rows) => {
    if (err) {
      console.error('Error querying database:', err.message);
      return;
    }
    
    console.log(`Found ${rows.length} AR Aging rows:`);
    rows.forEach((row) => {
      console.log(`${row.variable_name}: ${row.value}`);
    });
    
    // Close the database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        return;
      }
      console.log('Database connection closed.');
    });
  });
});
