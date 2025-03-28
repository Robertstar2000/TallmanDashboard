// Script to rebuild all rows in the database with proper sequential IDs
// Fixes the order and removes the extra Customer Metrics row
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

// Define the expected chart groups and variables in the correct order
const chartGroupOrder = [
  'Key Metrics',
  'Customer Metrics',
  'Historical Data',
  'Accounts',
  'Inventory',
  'POR Overview',
  'Daily Orders',
  'Web Orders',
  'AR Aging',
  'Site Distribution'
];

// Define the variables for each chart group in the correct order
const chartGroupVariables = {
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

// Get all rows from the current database
db.all('SELECT * FROM chart_data', (err, rows) => {
  if (err) {
    console.error('Error querying database:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the chart_data table`);
  
  // Create a map to store rows by chart group and variable
  const rowMap = new Map();
  rows.forEach(row => {
    const key = `${row.chart_group}|${row.variable_name}`;
    rowMap.set(key, row);
  });
  
  // Check for duplicate Customer Metrics rows
  const customerMetricsRows = rows.filter(row => row.chart_group === 'Customer Metrics');
  console.log(`Found ${customerMetricsRows.length} Customer Metrics rows`);
  
  if (customerMetricsRows.length > 24) {
    console.log('Found extra Customer Metrics row(s), will remove during rebuild');
    
    // Find duplicate rows (same variable name)
    const variableCounts = {};
    customerMetricsRows.forEach(row => {
      if (variableCounts[row.variable_name]) {
        variableCounts[row.variable_name]++;
      } else {
        variableCounts[row.variable_name] = 1;
      }
    });
    
    // Log the duplicates
    Object.entries(variableCounts).forEach(([variable, count]) => {
      if (count > 1) {
        console.log(`Found ${count} rows for Customer Metrics - ${variable}`);
      }
    });
  }
  
  // Start rebuilding the database
  console.log('Rebuilding database with properly ordered rows...');
  
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
        
        // Create an array to store all rows in the correct order
        const orderedRows = [];
        
        // Add rows in the correct order based on chart group and variable
        chartGroupOrder.forEach(chartGroup => {
          const variables = chartGroupVariables[chartGroup];
          if (!variables) {
            console.error(`No variables defined for chart group: ${chartGroup}`);
            return;
          }
          
          variables.forEach(variableName => {
            const key = `${chartGroup}|${variableName}`;
            const row = rowMap.get(key);
            
            if (row) {
              orderedRows.push(row);
            } else {
              // Create a new row if it doesn't exist
              console.log(`Creating new row for ${chartGroup} - ${variableName}`);
              orderedRows.push({
                chart_group: chartGroup,
                variable_name: variableName,
                server_name: chartGroup.includes('POR') ? 'POR' : 'P21',
                db_table_name: '',
                sql_expression: '',
                production_sql_expression: '',
                value: '0',
                transformer: '',
                last_updated: new Date().toISOString(),
                error: null,
                error_type: null
              });
            }
          });
        });
        
        // Verify we have the correct number of rows
        const expectedTotal = Object.values(chartGroupVariables).reduce((sum, vars) => sum + vars.length, 0);
        console.log(`Expected total rows: ${expectedTotal}, Actual rows: ${orderedRows.length}`);
        
        // Insert all rows with sequential IDs
        const insertPromises = [];
        
        orderedRows.forEach((row, index) => {
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
                last_updated,
                error,
                error_type
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              id,
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
                console.log(`Inserted row ${index + 1} with ID ${id}: ${row.chart_group} - ${row.variable_name}`);
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
    
    // Verify Customer Metrics has exactly 24 rows
    const customerMetricsCount = chartGroupCounts['Customer Metrics'] || 0;
    if (customerMetricsCount === 24) {
      console.log('\nCustomer Metrics has exactly 24 rows as required.');
    } else {
      console.log(`\nWARNING: Customer Metrics has ${customerMetricsCount} rows, expected 24.`);
    }
    
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
