// Script to ensure all IDs in the database are sequential
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

// Get all rows ordered by their rowid (which should be the insertion order)
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
  
  // Check if all IDs are in the correct format and sequential
  let allCorrect = true;
  let previousNumber = 0;
  
  rows.forEach((row, index) => {
    const expectedId = `row_${String(index + 1).padStart(3, '0')}`;
    
    if (row.id !== expectedId) {
      allCorrect = false;
      console.log(`Row ${index + 1} has ID ${row.id}, expected ${expectedId}`);
    }
    
    // Extract the number from the ID if it's in the correct format
    if (row.id && row.id.match(/^row_(\d+)$/)) {
      const currentNumber = parseInt(row.id.replace('row_', ''), 10);
      
      // Check if the numbers are sequential
      if (currentNumber !== previousNumber + 1 && previousNumber !== 0) {
        console.log(`Non-sequential ID detected: ${row.id} follows ${rows[index - 1].id}`);
      }
      
      previousNumber = currentNumber;
    }
  });
  
  if (allCorrect) {
    console.log('All IDs are already in the correct sequential format. No changes needed.');
    closeDb();
    return;
  }
  
  // Fix the IDs to be sequential
  console.log('\nFixing IDs to be sequential...');
  
  // Start a transaction
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('Error beginning transaction:', err.message);
      closeDb();
      return;
    }
    
    // Process each row
    const processNextRow = (index) => {
      if (index >= rows.length) {
        // All rows processed, commit the transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK');
          } else {
            console.log('\nTransaction committed. All row IDs updated to be sequential.');
          }
          
          // Verify the changes
          verifyChanges();
        });
        return;
      }
      
      const row = rows[index];
      const newId = `row_${String(index + 1).padStart(3, '0')}`;
      
      // Only update if the ID is different
      if (row.id !== newId) {
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
            
            // Process the next row
            processNextRow(index + 1);
          }
        );
      } else {
        // ID is already correct, move to the next row
        processNextRow(index + 1);
      }
    };
    
    // Start processing rows
    processNextRow(0);
  });
});

// Function to verify the changes
function verifyChanges() {
  db.all(`
    SELECT id, chart_group, variable_name
    FROM chart_data 
    ORDER BY rowid
  `, (err, rows) => {
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
