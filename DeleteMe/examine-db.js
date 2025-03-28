// Script to examine the SQLite database structure
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

// Get all tables in the database
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error(`Error getting tables: ${err.message}`);
    db.close();
    return;
  }
  
  console.log('Tables in the database:');
  console.log(tables.map(t => t.name).join(', '));
  
  // For each table, get its structure and sample data
  let tablesProcessed = 0;
  
  tables.forEach(table => {
    const tableName = table.name;
    
    // Get table structure
    db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
      if (err) {
        console.error(`Error getting columns for table ${tableName}: ${err.message}`);
        checkDone();
        return;
      }
      
      console.log(`\n=== Table: ${tableName} ===`);
      console.log('Columns:');
      columns.forEach(col => {
        console.log(`  ${col.name} (${col.type})`);
      });
      
      // Get row count
      db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, countResult) => {
        if (err) {
          console.error(`Error getting row count for table ${tableName}: ${err.message}`);
          checkDone();
          return;
        }
        
        console.log(`Total rows: ${countResult.count || 0}`);
        
        // Get sample data (first 5 rows)
        db.all(`SELECT * FROM ${tableName} LIMIT 5`, [], (err, rows) => {
          if (err) {
            console.error(`Error getting data for table ${tableName}: ${err.message}`);
          } else {
            console.log('Sample data:');
            if (rows.length === 0) {
              console.log('  No data');
            } else {
              rows.forEach(row => {
                console.log(JSON.stringify(row, null, 2));
              });
            }
          }
          
          checkDone();
        });
      });
    });
  });
  
  function checkDone() {
    tablesProcessed++;
    if (tablesProcessed === tables.length) {
      db.close(() => {
        console.log('\nDatabase connection closed.');
      });
    }
  }
});
