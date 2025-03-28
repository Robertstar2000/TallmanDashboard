// Simple script to check and fix IDs in the database
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

// Check the database
function checkDatabase() {
  console.log('Checking database for ID issues...');
  
  db.all('SELECT id, chart_group, variable_name FROM chart_data ORDER BY rowid', (err, rows) => {
    if (err) {
      console.error('Error querying database:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Found ${rows.length} rows in the database`);
    
    // Check for any ID issues
    let hasIssues = false;
    let nonRowFormatCount = 0;
    let nonSequentialCount = 0;
    let duplicateCount = 0;
    let nullCount = 0;
    
    // Track IDs to check for duplicates
    const idSet = new Set();
    
    rows.forEach((row, index) => {
      const expectedId = `row_${String(index + 1).padStart(3, '0')}`;
      
      // Check if ID is null
      if (!row.id) {
        nullCount++;
        hasIssues = true;
        console.log(`Row ${index + 1} has null ID, expected ${expectedId}`);
      } 
      // Check if ID is in the correct format
      else if (!row.id.match(/^row_\d+$/)) {
        nonRowFormatCount++;
        hasIssues = true;
        console.log(`Row ${index + 1} has ID ${row.id}, which is not in the row_XXX format`);
      } 
      // Check if ID is sequential
      else if (row.id !== expectedId) {
        nonSequentialCount++;
        hasIssues = true;
        console.log(`Row ${index + 1} has ID ${row.id}, expected ${expectedId}`);
      }
      
      // Check for duplicate IDs
      if (row.id && idSet.has(row.id)) {
        duplicateCount++;
        hasIssues = true;
        console.log(`Duplicate ID detected: ${row.id}`);
      } else if (row.id) {
        idSet.add(row.id);
      }
    });
    
    console.log('\nID Issues Summary:');
    console.log(`- Total rows: ${rows.length}`);
    console.log(`- Null IDs: ${nullCount}`);
    console.log(`- Non-row_XXX format IDs: ${nonRowFormatCount}`);
    console.log(`- Non-sequential IDs: ${nonSequentialCount}`);
    console.log(`- Duplicate IDs: ${duplicateCount}`);
    
    if (!hasIssues) {
      console.log('\nNo ID issues detected. All IDs are in the correct sequential format.');
      
      // Print the first 10 rows to verify
      console.log('\nFirst 10 rows:');
      rows.slice(0, 10).forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
      });
      
      closeDb();
    } else {
      console.log('\nID issues detected. Fixing...');
      fixIds();
    }
  });
}

// Fix the IDs
function fixIds() {
  db.all('SELECT rowid, id, chart_group, variable_name FROM chart_data ORDER BY rowid', (err, rows) => {
    if (err) {
      console.error('Error querying database for fix:', err.message);
      closeDb();
      return;
    }
    
    console.log(`Preparing to fix ${rows.length} rows`);
    
    // Start a transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err.message);
        closeDb();
        return;
      }
      
      let updateCount = 0;
      let errorCount = 0;
      
      // Process each row
      rows.forEach((row, index) => {
        const newId = `row_${String(index + 1).padStart(3, '0')}`;
        
        // Only update if the ID is different
        if (row.id !== newId) {
          db.run(
            'UPDATE chart_data SET id = ? WHERE rowid = ?',
            [newId, row.rowid],
            function(err) {
              if (err) {
                errorCount++;
                console.error(`Error updating row ${row.rowid}:`, err.message);
              } else if (this.changes > 0) {
                updateCount++;
                console.log(`Updated row ${row.rowid}: ${row.id || 'null'} -> ${newId}`);
              }
              
              // Check if all rows have been processed
              if (index === rows.length - 1) {
                // Commit the transaction
                db.run('COMMIT', (err) => {
                  if (err) {
                    console.error('Error committing transaction:', err.message);
                    db.run('ROLLBACK');
                    closeDb();
                  } else {
                    console.log(`\nTransaction committed. Updated ${updateCount} rows. Errors: ${errorCount}`);
                    verifyChanges();
                  }
                });
              }
            }
          );
        } else if (index === rows.length - 1) {
          // Last row and no update needed
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err.message);
              db.run('ROLLBACK');
              closeDb();
            } else {
              console.log(`\nTransaction committed. Updated ${updateCount} rows. Errors: ${errorCount}`);
              verifyChanges();
            }
          });
        }
      });
    });
  });
}

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

// Start the process
checkDatabase();
