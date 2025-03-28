// Script to fix the remaining row with incorrect ID format
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

// Find rows with incorrect ID format
db.all(`
  SELECT rowid, id, chart_group, variable_name 
  FROM chart_data 
  WHERE id NOT LIKE 'row_%'
`, (err, rows) => {
  if (err) {
    console.error('Error getting rows:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows with incorrect ID format`);
  
  if (rows.length === 0) {
    console.log('No rows need fixing. All IDs are in the correct format.');
    closeDb();
    return;
  }
  
  // Begin transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Update each row with incorrect ID
    let updateCount = 0;
    let processedCount = 0;
    
    rows.forEach((row, index) => {
      // Get the next available row_XXX ID
      db.get('SELECT MAX(id) as maxId FROM chart_data WHERE id LIKE "row_%"', (err, result) => {
        if (err) {
          console.error('Error getting max ID:', err.message);
          return;
        }
        
        let nextId = 1;
        if (result.maxId) {
          const match = result.maxId.match(/row_(\d+)/);
          if (match) {
            nextId = parseInt(match[1], 10) + 1;
          }
        }
        
        const newId = `row_${String(nextId).padStart(3, '0')}`;
        
        // Update the row with the new ID
        db.run(
          'UPDATE chart_data SET id = ? WHERE rowid = ?',
          [newId, row.rowid],
          function(err) {
            if (err) {
              console.error(`Error updating row ${row.rowid}:`, err.message);
            } else {
              updateCount++;
              console.log(`Updated ID: ${row.id || 'null'} -> ${newId} (${row.chart_group} - ${row.variable_name})`);
            }
            
            processedCount++;
            
            // If all rows have been processed, commit the transaction
            if (processedCount === rows.length) {
              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Error committing transaction:', err.message);
                  db.run('ROLLBACK');
                } else {
                  console.log(`\nTransaction committed. Updated ${updateCount} of ${rows.length} rows.`);
                }
                
                // Verify the changes
                verifyChanges();
              });
            }
          }
        );
      });
    });
  });
});

// Function to verify the changes
function verifyChanges() {
  db.all(`
    SELECT id, chart_group, variable_name 
    FROM chart_data 
    ORDER BY id
  `, (err, rows) => {
    if (err) {
      console.error('Error verifying changes:', err.message);
      closeDb();
      return;
    }
    
    console.log('\nVerification:');
    
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
    
    console.log(`- Total rows: ${rows.length}`);
    console.log(`- row_XXX format: ${rowFormatCount}`);
    console.log(`- Numeric format: ${numericFormatCount}`);
    console.log(`- Null or empty: ${nullOrEmptyCount}`);
    console.log(`- Other format: ${otherFormatCount}`);
    
    if (rowFormatCount === rows.length) {
      console.log('\nSUCCESS: All rows now have the correct ID format.');
    } else {
      console.log('\nWARNING: Not all rows have the correct ID format.');
    }
    
    closeDb();
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
