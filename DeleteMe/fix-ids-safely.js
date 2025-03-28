// Script to safely fix IDs in the database by avoiding conflicts
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

// First, let's get all rows and analyze the current state
db.all('SELECT rowid, id, chart_group, variable_name FROM chart_data ORDER BY rowid', (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the database`);
  
  // Analyze the current IDs
  const idMap = new Map(); // Maps rowid to current ID
  const idCounts = new Map(); // Tracks how many times each ID appears
  
  rows.forEach(row => {
    idMap.set(row.rowid, row.id);
    
    if (idCounts.has(row.id)) {
      idCounts.set(row.id, idCounts.get(row.id) + 1);
    } else {
      idCounts.set(row.id, 1);
    }
  });
  
  // Find duplicate IDs
  const duplicateIds = [];
  idCounts.forEach((count, id) => {
    if (count > 1) {
      duplicateIds.push(id);
    }
  });
  
  console.log(`Found ${duplicateIds.length} duplicate IDs: ${duplicateIds.join(', ')}`);
  
  // Two-phase approach:
  // 1. First, rename any duplicate IDs to temporary unique values
  // 2. Then, rename all IDs to their final sequential values
  
  // Start a transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Phase 1: Fix duplicates by assigning temporary unique IDs
    let tempIdCounter = 1;
    const tempIdPromises = [];
    
    // For each duplicate ID, find all rows with that ID except the first one
    // and assign them temporary unique IDs
    duplicateIds.forEach(duplicateId => {
      const rowsWithDuplicateId = rows.filter(row => row.id === duplicateId);
      
      // Skip the first occurrence, rename the rest
      for (let i = 1; i < rowsWithDuplicateId.length; i++) {
        const row = rowsWithDuplicateId[i];
        const tempId = `temp_${tempIdCounter++}`;
        
        tempIdPromises.push(new Promise((resolve, reject) => {
          db.run(
            'UPDATE chart_data SET id = ? WHERE rowid = ?',
            [tempId, row.rowid],
            function(err) {
              if (err) {
                console.error(`Error updating duplicate ID for row ${row.rowid}:`, err.message);
                reject(err);
              } else {
                console.log(`Updated duplicate ID: rowid ${row.rowid}: ${row.id} -> ${tempId}`);
                resolve();
              }
            }
          );
        }));
      }
    });
    
    // Execute all the temporary ID updates
    Promise.all(tempIdPromises)
      .then(() => {
        console.log('Phase 1 complete: All duplicate IDs have been given temporary unique values');
        
        // Phase 2: Assign final sequential IDs
        // Get the updated rows after fixing duplicates
        db.all('SELECT rowid, id, chart_group, variable_name FROM chart_data ORDER BY rowid', (err, updatedRows) => {
          if (err) {
            console.error('Error querying database after fixing duplicates:', err.message);
            db.run('ROLLBACK');
            closeDb();
            return;
          }
          
          const finalIdPromises = [];
          
          // Assign sequential IDs
          updatedRows.forEach((row, index) => {
            const finalId = `row_${String(index + 1).padStart(3, '0')}`;
            
            // Only update if the ID is different from the final ID
            if (row.id !== finalId) {
              finalIdPromises.push(new Promise((resolve, reject) => {
                db.run(
                  'UPDATE chart_data SET id = ? WHERE rowid = ?',
                  [finalId, row.rowid],
                  function(err) {
                    if (err) {
                      console.error(`Error updating final ID for row ${row.rowid}:`, err.message);
                      reject(err);
                    } else {
                      console.log(`Updated final ID: rowid ${row.rowid}: ${row.id} -> ${finalId}`);
                      resolve();
                    }
                  }
                );
              }));
            }
          });
          
          // Execute all the final ID updates
          Promise.all(finalIdPromises)
            .then(() => {
              console.log('Phase 2 complete: All rows have been assigned sequential IDs');
              
              // Commit the transaction
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                  db.run('ROLLBACK');
                  closeDb();
                  return;
                }
                
                console.log('Transaction committed. All IDs have been updated successfully.');
                verifyChanges();
              });
            })
            .catch(err => {
              console.error('Error in Phase 2:', err);
              db.run('ROLLBACK');
              closeDb();
            });
        });
      })
      .catch(err => {
        console.error('Error in Phase 1:', err);
        db.run('ROLLBACK');
        closeDb();
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
    
    console.log(`\nVerification: Found ${rows.length} rows in the database`);
    
    // Check if all IDs are now in the correct format and sequential
    let allCorrect = true;
    
    rows.forEach((row, index) => {
      const expectedId = `row_${String(index + 1).padStart(3, '0')}`;
      
      if (row.id !== expectedId) {
        allCorrect = false;
        console.log(`Row ${index + 1} still has incorrect ID ${row.id}, expected ${expectedId}`);
      }
    });
    
    if (allCorrect) {
      console.log('All IDs are now in the correct sequential format.');
    } else {
      console.log('Some IDs are still not in the correct format. Further investigation needed.');
    }
    
    // Print the first 10 rows to verify
    console.log('\nFirst 10 rows after update:');
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
