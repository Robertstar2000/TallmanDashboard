// Script to completely rebuild the database tables and ensure all IDs are properly sequential
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Create a backup of the existing database
const backupPath = `${dbPath}.backup-${Date.now()}`;
try {
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`Created backup of database at ${backupPath}`);
  }
} catch (err) {
  console.error('Error creating database backup:', err.message);
}

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// First, let's extract all the data from the current chart_data table
db.all('SELECT * FROM chart_data ORDER BY rowid', (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the chart_data table`);
  
  // Now, let's drop and recreate the chart_data table
  db.serialize(() => {
    // Create a temporary table to hold the data
    db.run('CREATE TABLE IF NOT EXISTS chart_data_temp AS SELECT * FROM chart_data WHERE 0', (err) => {
      if (err) {
        console.error('Error creating temporary table:', err.message);
        closeDb();
        return;
      }
      
      console.log('Created temporary table');
      
      // Insert the data into the temporary table with new sequential IDs
      const insertStmt = db.prepare(`
        INSERT INTO chart_data_temp (
          id,
          chart_group,
          variable_name,
          server_name,
          db_table_name,
          sql_expression,
          production_sql_expression,
          value,
          transformer,
          last_updated,
          error,
          error_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      rows.forEach((row, index) => {
        const newId = `row_${String(index + 1).padStart(3, '0')}`;
        
        insertStmt.run(
          newId,
          row.chart_group,
          row.variable_name,
          row.server_name,
          row.db_table_name,
          row.sql_expression,
          row.production_sql_expression,
          row.value,
          row.transformer,
          row.last_updated,
          row.error,
          row.error_type,
          (err) => {
            if (err) {
              console.error(`Error inserting row ${index + 1}:`, err.message);
            }
          }
        );
      });
      
      insertStmt.finalize();
      
      // Drop the original table
      db.run('DROP TABLE chart_data', (err) => {
        if (err) {
          console.error('Error dropping original table:', err.message);
          closeDb();
          return;
        }
        
        console.log('Dropped original table');
        
        // Rename the temporary table to the original name
        db.run('ALTER TABLE chart_data_temp RENAME TO chart_data', (err) => {
          if (err) {
            console.error('Error renaming temporary table:', err.message);
            closeDb();
            return;
          }
          
          console.log('Renamed temporary table to chart_data');
          
          // Verify the changes
          db.all('SELECT id, chart_group, variable_name FROM chart_data ORDER BY rowid', (err, newRows) => {
            if (err) {
              console.error('Error verifying changes:', err.message);
              closeDb();
              return;
            }
            
            console.log(`\nVerification: Found ${newRows.length} rows in the rebuilt database`);
            
            // Check if all IDs are now in the correct format and sequential
            let allCorrect = true;
            
            newRows.forEach((row, index) => {
              const expectedId = `row_${String(index + 1).padStart(3, '0')}`;
              
              if (row.id !== expectedId) {
                allCorrect = false;
                console.log(`Row ${index + 1} has incorrect ID ${row.id}, expected ${expectedId}`);
              }
            });
            
            if (allCorrect) {
              console.log('All IDs are now in the correct sequential format.');
            } else {
              console.log('Some IDs are still not in the correct format. Further investigation needed.');
            }
            
            // Print the first 10 rows to verify
            console.log('\nFirst 10 rows after rebuild:');
            newRows.slice(0, 10).forEach((row, index) => {
              console.log(`${index + 1}. ID: ${row.id}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
            });
            
            closeDb();
          });
        });
      });
    });
  });
});

// Close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
