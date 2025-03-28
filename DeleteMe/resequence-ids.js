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
    SELECT id, chart_group, variable_name 
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
    
    // Create a temporary table to store the new IDs
    db.run(`
      CREATE TABLE IF NOT EXISTS temp_id_mapping (
        old_id TEXT PRIMARY KEY,
        new_id TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating temporary table:', err.message);
        db.run('ROLLBACK', closeDb);
        return;
      }
      
      // Clear any existing mappings
      db.run('DELETE FROM temp_id_mapping', (err) => {
        if (err) {
          console.error('Error clearing temporary table:', err.message);
          db.run('ROLLBACK', closeDb);
          return;
        }
        
        // Generate new sequential IDs and store the mapping
        const insertStmt = db.prepare('INSERT INTO temp_id_mapping (old_id, new_id) VALUES (?, ?)');
        
        let currentChartGroup = '';
        let groupCounter = 1;
        let sequenceNumber = 1;
        
        rows.forEach((row, index) => {
          // If we're starting a new chart group, reset the counter
          if (row.chart_group !== currentChartGroup) {
            currentChartGroup = row.chart_group;
            groupCounter = 1;
          }
          
          // Generate a new ID in the format 'row_001'
          const newId = `row_${sequenceNumber.toString().padStart(3, '0')}`;
          
          // Store the mapping
          insertStmt.run(row.id, newId);
          
          console.log(`Mapping ${row.id} -> ${newId} (${row.chart_group} - ${row.variable_name})`);
          
          groupCounter++;
          sequenceNumber++;
        });
        
        insertStmt.finalize();
        
        // Update the chart_data table with the new IDs
        db.run(`
          UPDATE chart_data
          SET id = (
            SELECT new_id
            FROM temp_id_mapping
            WHERE old_id = chart_data.id
          )
          WHERE id IN (SELECT old_id FROM temp_id_mapping)
        `, function(err) {
          if (err) {
            console.error('Error updating IDs:', err.message);
            db.run('ROLLBACK', closeDb);
            return;
          }
          
          console.log(`Updated ${this.changes} rows with new IDs`);
          
          // Drop the temporary table
          db.run('DROP TABLE temp_id_mapping', (err) => {
            if (err) {
              console.error('Error dropping temporary table:', err.message);
              db.run('ROLLBACK', closeDb);
              return;
            }
            
            // Commit the transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK', closeDb);
                return;
              }
              
              console.log('ID resequencing completed successfully');
              
              // Create a cache-busting file to force a refresh of the chart data
              const cacheBustFile = path.join(process.cwd(), 'data', 'cache-bust.txt');
              fs.writeFileSync(cacheBustFile, new Date().toISOString());
              console.log(`Created cache-busting file at ${cacheBustFile}`);
              
              // Verify the resequencing
              verifyResequencing();
            });
          });
        });
      });
    });
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
