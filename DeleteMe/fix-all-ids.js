// Script to fix all IDs in the database to be in the format row_XXX
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

// Get all rows ordered by chart_group and variable_name
db.all(`
  SELECT rowid, id, chart_group, variable_name 
  FROM chart_data 
  ORDER BY chart_group, variable_name
`, (err, rows) => {
  if (err) {
    console.error('Error getting rows:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the database`);
  
  // Begin transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Update each row with a new sequential ID
    let updateCount = 0;
    let processedCount = 0;
    
    // Process rows sequentially
    processNextRow(0);
    
    function processNextRow(index) {
      if (index >= rows.length) {
        // All rows processed, commit transaction
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
        return;
      }
      
      const row = rows[index];
      const newId = `row_${String(index + 1).padStart(3, '0')}`;
      
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
          
          // Process the next row
          processNextRow(index + 1);
        }
      );
    }
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
