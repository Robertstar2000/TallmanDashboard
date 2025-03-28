// Script to ensure all row IDs in the database are in the correct format
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

// Get all rows with their IDs
db.all(`
  SELECT id, chart_group, variable_name, rowid
  FROM chart_data 
  ORDER BY rowid
`, (err, rows) => {
  if (err) {
    console.error('Error getting rows:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the database`);
  
  // Count different ID formats
  let rowFormatCount = 0;
  let numericFormatCount = 0;
  let nullOrEmptyCount = 0;
  let otherFormatCount = 0;
  
  rows.forEach(row => {
    const id = row.id;
    
    if (id === null || id === '') {
      nullOrEmptyCount++;
    } else if (/^row_\d+$/.test(id)) {
      rowFormatCount++;
    } else if (/^\d+$/.test(id)) {
      numericFormatCount++;
    } else {
      otherFormatCount++;
    }
  });
  
  console.log('\nDatabase ID Format Summary:');
  console.log(`- Total rows: ${rows.length}`);
  console.log(`- row_XXX format: ${rowFormatCount}`);
  console.log(`- Numeric format: ${numericFormatCount}`);
  console.log(`- Null or empty: ${nullOrEmptyCount}`);
  console.log(`- Other format: ${otherFormatCount}`);
  
  // If all IDs are already in the correct format, we're done
  if (rowFormatCount === rows.length) {
    console.log('\nAll rows already have the correct ID format. No changes needed.');
    closeDb();
    return;
  }
  
  // Otherwise, update the IDs to the correct format
  console.log('\nUpdating row IDs to the correct format...');
  
  // Start a transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Create a counter for sequential IDs
    let idCounter = 1;
    
    // Process each row
    const processNextRow = (index) => {
      if (index >= rows.length) {
        // All rows processed, commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK');
          } else {
            console.log('\nTransaction committed. All row IDs updated successfully.');
          }
          closeDb();
        });
        return;
      }
      
      const row = rows[index];
      const newId = `row_${String(idCounter).padStart(3, '0')}`;
      
      // Update the row ID
      db.run(
        'UPDATE chart_data SET id = ? WHERE rowid = ?',
        [newId, row.rowid],
        (err) => {
          if (err) {
            console.error(`Error updating row ${row.rowid}:`, err.message);
            db.run('ROLLBACK');
            closeDb();
            return;
          }
          
          console.log(`Updated row ${row.rowid}: ${row.id || 'null'} -> ${newId}`);
          
          // Increment the counter and process the next row
          idCounter++;
          processNextRow(index + 1);
        }
      );
    };
    
    // Start processing rows
    processNextRow(0);
  });
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
