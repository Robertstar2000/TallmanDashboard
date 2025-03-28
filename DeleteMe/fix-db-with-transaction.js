// Script to fix the database using a proper transaction
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

// Extract all the data from the current chart_data table
db.all('SELECT * FROM chart_data ORDER BY rowid', (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the chart_data table`);
  
  // Start a transaction for all operations
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Drop and recreate the chart_data table
    db.run('DROP TABLE IF EXISTS chart_data_temp', (err) => {
      if (err) {
        console.error('Error dropping temporary table:', err.message);
        db.run('ROLLBACK');
        closeDb();
        return;
      }
      
      // Create the temporary table with the same schema
      db.run(`
        CREATE TABLE chart_data_temp (
          id TEXT PRIMARY KEY,
          chart_group TEXT,
          variable_name TEXT,
          server_name TEXT,
          db_table_name TEXT,
          sql_expression TEXT,
          production_sql_expression TEXT,
          value TEXT,
          transformer TEXT,
          last_updated TEXT,
          error TEXT,
          error_type TEXT
        )
      `, (err) => {
        if (err) {
          console.error('Error creating temporary table:', err.message);
          db.run('ROLLBACK');
          closeDb();
          return;
        }
        
        console.log('Created temporary table');
        
        // Insert all rows into the temporary table with new sequential IDs
        const insertPromises = [];
        
        rows.forEach((row, index) => {
          const newId = `row_${String(index + 1).padStart(3, '0')}`;
          
          insertPromises.push(new Promise((resolve, reject) => {
            db.run(`
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
            `, [
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
              row.error_type
            ], function(err) {
              if (err) {
                console.error(`Error inserting row ${index + 1}:`, err.message);
                reject(err);
              } else {
                console.log(`Inserted row ${index + 1} with ID ${newId}`);
                resolve();
              }
            });
          }));
        });
        
        // Wait for all inserts to complete
        Promise.all(insertPromises)
          .then(() => {
            console.log('All rows inserted into temporary table');
            
            // Verify the temporary table
            db.all('SELECT COUNT(*) as count FROM chart_data_temp', (err, result) => {
              if (err) {
                console.error('Error verifying temporary table:', err.message);
                db.run('ROLLBACK');
                closeDb();
                return;
              }
              
              const tempRowCount = result[0].count;
              console.log(`Temporary table has ${tempRowCount} rows`);
              
              if (tempRowCount !== rows.length) {
                console.error(`Error: Temporary table has ${tempRowCount} rows, expected ${rows.length}`);
                db.run('ROLLBACK');
                closeDb();
                return;
              }
              
              // Drop the original table
              db.run('DROP TABLE chart_data', (err) => {
                if (err) {
                  console.error('Error dropping original table:', err.message);
                  db.run('ROLLBACK');
                  closeDb();
                  return;
                }
                
                console.log('Dropped original table');
                
                // Rename the temporary table to the original name
                db.run('ALTER TABLE chart_data_temp RENAME TO chart_data', (err) => {
                  if (err) {
                    console.error('Error renaming temporary table:', err.message);
                    db.run('ROLLBACK');
                    closeDb();
                    return;
                  }
                  
                  console.log('Renamed temporary table to chart_data');
                  
                  // Commit the transaction
                  db.run('COMMIT', (err) => {
                    if (err) {
                      console.error('Error committing transaction:', err.message);
                      db.run('ROLLBACK');
                      closeDb();
                      return;
                    }
                    
                    console.log('Transaction committed');
                    
                    // Verify the final result
                    verifyChanges();
                  });
                });
              });
            });
          })
          .catch(err => {
            console.error('Error during inserts:', err);
            db.run('ROLLBACK');
            closeDb();
          });
      });
    });
  });
});

// Verify the changes
function verifyChanges() {
  db.all('SELECT id, chart_group, variable_name FROM chart_data ORDER BY rowid', (err, rows) => {
    if (err) {
      console.error('Error verifying changes:', err.message);
      closeDb();
      return;
    }
    
    console.log(`\nVerification: Found ${rows.length} rows in the rebuilt database`);
    
    // Check if all IDs are now in the correct format and sequential
    let allCorrect = true;
    
    rows.forEach((row, index) => {
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
    rows.slice(0, 10).forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
    });
    
    closeDb();
  });
}

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
