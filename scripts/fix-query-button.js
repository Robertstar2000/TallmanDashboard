/**
 * Script to fix the "Run Queries" button issue
 * Ensures proper sequencing in the database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, '..', 'data', 'dashboard.db');

// Open database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the dashboard database.');
  
  // Update the query order in the database
  db.run("UPDATE cache_control SET value = ? WHERE key = 'query_order'", ['sequential'], function(err) {
    if (err) {
      console.error('Error updating query order:', err.message);
    } else {
      console.log('Updated query order to sequential.');
    }
    
    // Create cache refresh markers
    const cacheRefreshPath = path.join(__dirname, '..', 'data', 'cache-refresh.txt');
    const refreshRequiredPath = path.join(__dirname, '..', 'data', 'refresh_required');
    
    // Create cache-refresh.txt with current timestamp
    fs.writeFileSync(cacheRefreshPath, new Date().toISOString(), 'utf8');
    console.log('Created cache-refresh.txt marker');
    
    // Create refresh_required file
    fs.writeFileSync(refreshRequiredPath, 'true', 'utf8');
    console.log('Created refresh_required marker');
    
    // Update the last refresh timestamp
    db.run("INSERT OR REPLACE INTO cache_control (key, value) VALUES ('last_refresh', ?)", [new Date().toISOString()], function(err) {
      if (err) {
        console.error('Error updating last refresh:', err.message);
      } else {
        console.log('Updated last refresh timestamp.');
      }
      
      // Close the database connection
      db.close();
      console.log('Fix completed. Please restart the application.');
    });
  });
});
