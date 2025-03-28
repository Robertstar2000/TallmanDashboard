// Script to fix Customer Metrics and Daily Orders rows
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

// Begin transaction
db.run('BEGIN TRANSACTION', (err) => {
  if (err) {
    console.error('Error beginning transaction:', err.message);
    closeDb();
    return;
  }
  
  // 1. Fix Customer Metrics - delete the row with null ID
  db.run("DELETE FROM chart_data WHERE chart_group = 'Customer Metrics' AND id IS NULL", function(err) {
    if (err) {
      console.error('Error deleting Customer Metrics row:', err.message);
      db.run('ROLLBACK', closeDb);
      return;
    }
    
    console.log(`Deleted ${this.changes} Customer Metrics row(s) with null ID`);
    
    // 2. Fix Daily Orders - add a new row by copying data from an existing row
    db.get("SELECT * FROM chart_data WHERE chart_group = 'Daily Orders' LIMIT 1", (err, row) => {
      if (err) {
        console.error('Error getting Daily Orders template row:', err.message);
        db.run('ROLLBACK', closeDb);
        return;
      }
      
      if (!row) {
        console.error('No Daily Orders row found to copy from');
        db.run('ROLLBACK', closeDb);
        return;
      }
      
      // Create a new row based on the template
      const newRow = {
        id: 'do7', // Use a unique ID
        chart_group: 'Daily Orders',
        variable_name: 'Day-6', // Add the missing day
        server_name: row.server_name,
        db_table_name: row.db_table_name,
        sql_expression: row.sql_expression,
        production_sql_expression: row.production_sql_expression,
        value: '21', // Sample value
        transformer: row.transformer,
        last_updated: new Date().toISOString()
      };
      
      // Insert the new row
      db.run(`
        INSERT INTO chart_data (
          id, chart_group, variable_name, server_name, db_table_name,
          sql_expression, production_sql_expression, value, transformer, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newRow.id,
        newRow.chart_group,
        newRow.variable_name,
        newRow.server_name,
        newRow.db_table_name,
        newRow.sql_expression,
        newRow.production_sql_expression,
        newRow.value,
        newRow.transformer,
        newRow.last_updated
      ], function(err) {
        if (err) {
          console.error('Error inserting new Daily Orders row:', err.message);
          db.run('ROLLBACK', closeDb);
          return;
        }
        
        console.log(`Added new Daily Orders row with ID ${newRow.id}`);
        
        // Commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK', closeDb);
            return;
          }
          
          console.log('Chart group fixes applied successfully');
          
          // Create a cache-busting file to force a refresh of the chart data
          const cacheBustFile = path.join(process.cwd(), 'data', 'cache-bust.txt');
          fs.writeFileSync(cacheBustFile, new Date().toISOString());
          console.log(`Created cache-busting file at ${cacheBustFile}`);
          
          // Verify the fixes
          verifyFixes();
        });
      });
    });
  });
});

// Function to verify the fixes
function verifyFixes() {
  console.log('\nVerifying fixes:');
  
  // Check Customer Metrics count
  db.get("SELECT COUNT(*) as count FROM chart_data WHERE chart_group = 'Customer Metrics'", (err, row) => {
    if (err) {
      console.error('Error counting Customer Metrics rows:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Customer Metrics now has ${row.count} rows (should be 24)`);
    
    // Check Daily Orders count
    db.get("SELECT COUNT(*) as count FROM chart_data WHERE chart_group = 'Daily Orders'", (err, row) => {
      if (err) {
        console.error('Error counting Daily Orders rows:', err.message);
        closeDb();
        return;
      }
      
      console.log(`Daily Orders now has ${row.count} rows (should be 7)`);
      
      // Check total count
      db.get("SELECT COUNT(*) as count FROM chart_data", (err, row) => {
        if (err) {
          console.error('Error counting total rows:', err.message);
          closeDb();
          return;
        }
        
        console.log(`Total row count: ${row.count} (should be 174)`);
        closeDb();
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
      console.log('\nDatabase connection closed');
    }
  });
}
