// Script to resequence all IDs in the database to be sequential with the admin spreadsheet position
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

// Chart groups in the desired order
const chartGroupOrder = [
  'Key Metrics',
  'Site Distribution',
  'Accounts',
  'Customer Metrics',
  'Historical Data',
  'Inventory',
  'POR Overview',
  'Daily Orders',
  'AR Aging',
  'Web Orders'
];

// Begin transaction
db.run('BEGIN TRANSACTION', (err) => {
  if (err) {
    console.error('Error beginning transaction:', err.message);
    closeDb();
    return;
  }
  
  // Get all rows ordered by chart group and variable name
  db.all(`
    SELECT rowid as original_rowid, id, chart_group, variable_name 
    FROM chart_data 
    ORDER BY 
      CASE chart_group
        ${chartGroupOrder.map((group, index) => `WHEN '${group}' THEN ${index}`).join('\n        ')}
        ELSE 999
      END,
      variable_name
  `, (err, rows) => {
    if (err) {
      console.error('Error getting rows:', err.message);
      db.run('ROLLBACK', closeDb);
      return;
    }
    
    console.log(`Found ${rows.length} rows to resequence`);
    
    // Process each row and update its ID
    let sequenceNumber = 1;
    let processedRows = 0;
    
    // Function to process rows one by one
    function processRow(index) {
      if (index >= rows.length) {
        // All rows processed, commit transaction
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err.message);
            db.run('ROLLBACK', closeDb);
            return;
          }
          
          console.log(`Successfully resequenced ${processedRows} rows`);
          
          // Create a cache-busting file to force a refresh of the chart data
          const cacheBustFile = path.join(process.cwd(), 'data', 'cache-bust.txt');
          fs.writeFileSync(cacheBustFile, new Date().toISOString());
          console.log(`Created cache-busting file at ${cacheBustFile}`);
          
          // Verify the resequencing
          verifyResequencing();
        });
        return;
      }
      
      const row = rows[index];
      const newId = `row_${sequenceNumber.toString().padStart(3, '0')}`;
      
      console.log(`Updating row ${row.original_rowid}: ${row.id || 'NULL'} -> ${newId} (${row.chart_group} - ${row.variable_name})`);
      
      // Update the row with the new ID
      db.run(
        'UPDATE chart_data SET id = ? WHERE rowid = ?',
        [newId, row.original_rowid],
        function(err) {
          if (err) {
            console.error(`Error updating row ${row.original_rowid}:`, err.message);
            db.run('ROLLBACK', closeDb);
            return;
          }
          
          if (this.changes > 0) {
            processedRows++;
          }
          
          // Process the next row
          sequenceNumber++;
          processRow(index + 1);
        }
      );
    }
    
    // Start processing rows
    processRow(0);
  });
});

// Function to verify the resequencing
function verifyResequencing() {
  console.log('\nVerifying resequencing:');
  
  // Check that all IDs follow the new pattern
  db.all("SELECT id FROM chart_data ORDER BY id", (err, rows) => {
    if (err) {
      console.error('Error verifying resequencing:', err.message);
      closeDb();
      return;
    }
    
    const validPattern = /^row_\d{3}$/;
    const invalidIds = rows.filter(row => !validPattern.test(row.id));
    
    if (invalidIds.length > 0) {
      console.error(`Found ${invalidIds.length} rows with invalid IDs:`);
      invalidIds.forEach(row => console.error(`  ${row.id}`));
    } else {
      console.log(`All ${rows.length} rows have valid sequential IDs`);
    }
    
    // Count rows by chart group
    db.all("SELECT chart_group, COUNT(*) as count FROM chart_data GROUP BY chart_group ORDER BY chart_group", (err, rows) => {
      if (err) {
        console.error('Error counting rows by chart group:', err.message);
        closeDb();
        return;
      }
      
      console.log('\nChart Group Counts:');
      console.log('===================');
      
      let totalRows = 0;
      rows.forEach(row => {
        console.log(`${row.chart_group}: ${row.count} rows`);
        totalRows += row.count;
      });
      
      console.log('===================');
      console.log(`Total: ${totalRows} rows`);
      
      closeDb();
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
