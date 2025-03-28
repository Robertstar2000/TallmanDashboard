// Script to clean the database by removing any rows without chart groups
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

// Main function to clean the database
function cleanDatabase() {
  // Begin transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Find rows without chart groups
    db.all("SELECT id, chart_group FROM chart_data WHERE chart_group IS NULL OR chart_group = ''", (err, rows) => {
      if (err) {
        console.error('Error finding rows without chart groups:', err.message);
        db.run('ROLLBACK', closeDb);
        return;
      }
      
      console.log(`Found ${rows.length} rows without chart groups`);
      
      if (rows.length === 0) {
        console.log('No rows need to be deleted.');
        db.run('COMMIT', closeDb);
        return;
      }
      
      // Delete rows without chart groups
      const idsToDelete = rows.map(row => row.id);
      const placeholders = idsToDelete.map(() => '?').join(',');
      const deleteQuery = `DELETE FROM chart_data WHERE id IN (${placeholders})`;
      
      db.run(deleteQuery, idsToDelete, function(err) {
        if (err) {
          console.error('Error deleting rows:', err.message);
          db.run('ROLLBACK', closeDb);
          return;
        }
        
        console.log(`Deleted ${this.changes} rows without chart groups`);
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK', closeDb);
            return;
          }
          
          console.log('Database cleaned successfully');
          
          // Create a cache-busting file to force a refresh of the chart data
          const cacheBustFile = path.join(dataDir, 'cache-bust.txt');
          fs.writeFileSync(cacheBustFile, new Date().toISOString());
          console.log(`Created cache-busting file at ${cacheBustFile}`);
          
          closeDb();
        });
      });
    });
  });
}

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

// Run the main function
cleanDatabase();
