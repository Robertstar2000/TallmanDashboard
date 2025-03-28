// Script to rebuild all 174 rows in the database with proper sequential IDs
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Path to initial-data.ts
const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
console.log(`Initial data path: ${initialDataPath}`);

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

// Read the initial-data.ts file
fs.readFile(initialDataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading initial-data.ts:', err.message);
    closeDb();
    return;
  }
  
  console.log('Successfully read initial-data.ts');
  
  // Extract the initialSpreadsheetData array from the file
  const match = data.match(/export const initialSpreadsheetData: SpreadsheetRow\[\] = (\[[\s\S]*?\]);/);
  if (!match) {
    console.error('Could not find initialSpreadsheetData array in initial-data.ts');
    closeDb();
    return;
  }
  
  // Parse the initialSpreadsheetData array
  let initialData;
  try {
    // Replace TypeScript types and convert to valid JavaScript
    const jsString = match[1]
      .replace(/SpreadsheetRow/g, '')
      .replace(/ServerName/g, '')
      .replace(/as/g, '')
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":');
    
    // Use Function constructor to safely evaluate the JavaScript
    initialData = new Function(`return ${jsString}`)();
    console.log(`Successfully parsed ${initialData.length} rows from initial-data.ts`);
  } catch (err) {
    console.error('Error parsing initialSpreadsheetData:', err.message);
    closeDb();
    return;
  }
  
  // Start rebuilding the database
  console.log('Rebuilding database with all 174 rows...');
  
  // Start a transaction
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
        
        // Insert all rows into the temporary table with sequential IDs
        const insertPromises = [];
        
        // Create a mapping of chart groups and variables to ensure we have all 174 rows
        const chartGroups = {
          'AR Aging': ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
          'Accounts': [
            'Payable (January)', 'Payable (February)', 'Payable (March)', 'Payable (April)', 
            'Payable (May)', 'Payable (June)', 'Payable (July)', 'Payable (August)', 
            'Payable (September)', 'Payable (October)', 'Payable (November)', 'Payable (December)',
            'Receivable (January)', 'Receivable (February)', 'Receivable (March)', 'Receivable (April)', 
            'Receivable (May)', 'Receivable (June)', 'Receivable (July)', 'Receivable (August)', 
            'Receivable (September)', 'Receivable (October)', 'Receivable (November)', 'Receivable (December)',
            'Overdue (January)', 'Overdue (February)', 'Overdue (March)', 'Overdue (April)', 
            'Overdue (May)', 'Overdue (June)', 'Overdue (July)', 'Overdue (August)', 
            'Overdue (September)', 'Overdue (October)', 'Overdue (November)', 'Overdue (December)'
          ],
          'Customer Metrics': [
            'New (January)', 'New (February)', 'New (March)', 'New (April)', 
            'New (May)', 'New (June)', 'New (July)', 'New (August)', 
            'New (September)', 'New (October)', 'New (November)', 'New (December)',
            'Prospects (January)', 'Prospects (February)', 'Prospects (March)', 'Prospects (April)', 
            'Prospects (May)', 'Prospects (June)', 'Prospects (July)', 'Prospects (August)', 
            'Prospects (September)', 'Prospects (October)', 'Prospects (November)', 'Prospects (December)'
          ],
          'Daily Orders': ['Today', 'Yesterday', 'Day-2', 'Day-3', 'Day-4', 'Day-5', 'Day-6'],
          'Historical Data': [
            'P21 (January)', 'P21 (February)', 'P21 (March)', 'P21 (April)', 
            'P21 (May)', 'P21 (June)', 'P21 (July)', 'P21 (August)', 
            'P21 (September)', 'P21 (October)', 'P21 (November)', 'P21 (December)',
            'POR (January)', 'POR (February)', 'POR (March)', 'POR (April)', 
            'POR (May)', 'POR (June)', 'POR (July)', 'POR (August)', 
            'POR (September)', 'POR (October)', 'POR (November)', 'POR (December)',
            'Total {P21+POR} (January)', 'Total {P21+POR} (February)', 'Total {P21+POR} (March)', 'Total {P21+POR} (April)', 
            'Total {P21+POR} (May)', 'Total {P21+POR} (June)', 'Total {P21+POR} (July)', 'Total {P21+POR} (August)', 
            'Total {P21+POR} (September)', 'Total {P21+POR} (October)', 'Total {P21+POR} (November)', 'Total {P21+POR} (December)'
          ],
          'Inventory': ['In Stock (Columbus)', 'In Stock (Addison)', 'In Stock (Lake City)', 'In Stock (Total)', 
                        'On Order (Columbus)', 'On Order (Addison)', 'On Order (Lake City)', 'On Order (Total)'],
          'Key Metrics': ['Total Revenue', 'Average Order Value', 'Customer Count', 'Order Count', 'Items Sold', 'Conversion Rate', 'Return Rate'],
          'Site Distribution': ['Columbus', 'Addison', 'Lake City'],
          'POR Overview': [
            'New Rentals (January)', 'New Rentals (February)', 'New Rentals (March)', 'New Rentals (April)', 
            'New Rentals (May)', 'New Rentals (June)', 'New Rentals (July)', 'New Rentals (August)', 
            'New Rentals (September)', 'New Rentals (October)', 'New Rentals (November)', 'New Rentals (December)',
            'Open Rentals (January)', 'Open Rentals (February)', 'Open Rentals (March)', 'Open Rentals (April)', 
            'Open Rentals (May)', 'Open Rentals (June)', 'Open Rentals (July)', 'Open Rentals (August)', 
            'Open Rentals (September)', 'Open Rentals (October)', 'Open Rentals (November)', 'Open Rentals (December)',
            'Rental Value (January)', 'Rental Value (February)', 'Rental Value (March)', 'Rental Value (April)', 
            'Rental Value (May)', 'Rental Value (June)', 'Rental Value (July)', 'Rental Value (August)', 
            'Rental Value (September)', 'Rental Value (October)', 'Rental Value (November)', 'Rental Value (December)'
          ],
          'Web Orders': [
            'Orders (January)', 'Orders (February)', 'Orders (March)', 'Orders (April)', 
            'Orders (May)', 'Orders (June)', 'Orders (July)', 'Orders (August)', 
            'Orders (September)', 'Orders (October)', 'Orders (November)', 'Orders (December)'
          ]
        };
        
        // Count the total number of rows we should have
        let totalRowCount = 0;
        Object.values(chartGroups).forEach(variables => {
          totalRowCount += variables.length;
        });
        
        console.log(`Expected total row count: ${totalRowCount}`);
        
        // Create an array of all rows we need to insert
        const rowsToInsert = [];
        
        // First, use the data from initialData if available
        initialData.forEach(row => {
          rowsToInsert.push({
            chartGroup: row.chartGroup,
            variableName: row.variableName,
            serverName: row.serverName || 'P21',
            tableName: row.tableName || '',
            sqlExpression: row.sqlExpression || '',
            productionSqlExpression: row.productionSqlExpression || row.sqlExpression || '',
            value: row.value || '0',
            transformer: row.transformer || ''
          });
        });
        
        // Check if we need to add any missing rows
        if (rowsToInsert.length < totalRowCount) {
          console.log(`Need to add ${totalRowCount - rowsToInsert.length} missing rows`);
          
          // Create a set of existing rows for quick lookup
          const existingRows = new Set();
          rowsToInsert.forEach(row => {
            existingRows.add(`${row.chartGroup}|${row.variableName}`);
          });
          
          // Add missing rows
          Object.entries(chartGroups).forEach(([chartGroup, variables]) => {
            variables.forEach(variableName => {
              const key = `${chartGroup}|${variableName}`;
              if (!existingRows.has(key)) {
                console.log(`Adding missing row: ${key}`);
                rowsToInsert.push({
                  chartGroup,
                  variableName,
                  serverName: chartGroup.includes('POR') ? 'POR' : 'P21',
                  tableName: '',
                  sqlExpression: '',
                  productionSqlExpression: '',
                  value: '0',
                  transformer: ''
                });
              }
            });
          });
        }
        
        // Now insert all rows with sequential IDs
        rowsToInsert.forEach((row, index) => {
          const id = `row_${String(index + 1).padStart(3, '0')}`;
          
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
                last_updated
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              id,
              row.chartGroup,
              row.variableName,
              row.serverName,
              row.tableName,
              row.sqlExpression,
              row.productionSqlExpression,
              row.value,
              row.transformer,
              new Date().toISOString()
            ], function(err) {
              if (err) {
                console.error(`Error inserting row ${index + 1}:`, err.message);
                reject(err);
              } else {
                console.log(`Inserted row ${index + 1} with ID ${id}: ${row.chartGroup} - ${row.variableName}`);
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
              
              // Drop the original table
              db.run('DROP TABLE IF EXISTS chart_data', (err) => {
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
    
    // Print the last 10 rows to verify
    console.log('\nLast 10 rows after rebuild:');
    rows.slice(-10).forEach((row, index) => {
      console.log(`${rows.length - 10 + index + 1}. ID: ${row.id}, Chart Group: ${row.chart_group}, Variable: ${row.variable_name}`);
    });
    
    // Count rows by chart group
    const chartGroupCounts = {};
    rows.forEach(row => {
      if (chartGroupCounts[row.chart_group]) {
        chartGroupCounts[row.chart_group]++;
      } else {
        chartGroupCounts[row.chart_group] = 1;
      }
    });
    
    console.log('\nRows by chart group:');
    Object.entries(chartGroupCounts).forEach(([chartGroup, count]) => {
      console.log(`${chartGroup}: ${count} rows`);
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
