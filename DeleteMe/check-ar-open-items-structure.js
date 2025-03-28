// Script to check the structure of the ar_open_items table in P21
const odbc = require('odbc');
const Database = require('better-sqlite3');
const fs = require('fs');

// Function to log messages
function log(message) {
  console.log(message);
}

// Connect to the SQLite database
log('Connecting to SQLite database...');
const db = new Database('./data/dashboard.db');

// Get the AR Aging queries from the database
log('Fetching AR Aging queries from the database...');
const rows = db.prepare(`
  SELECT id, chart_group, variable_name, server_name, db_table_name, 
         sql_expression, production_sql_expression, value
  FROM chart_data 
  WHERE chart_group = 'AR Aging'
  ORDER BY id
`).all();

log(`Found ${rows.length} AR Aging queries in the database`);

// Display the queries
log('\nCurrent AR Aging Queries:');
rows.forEach((row, index) => {
  const bucketNames = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
  const bucketName = index < bucketNames.length ? bucketNames[index] : 'Unknown';
  
  log(`\n${bucketName} (${row.variable_name}):`);
  log(`ID: ${row.id}`);
  log(`Server: ${row.server_name}`);
  log(`Table: ${row.db_table_name}`);
  log(`SQL: ${row.sql_expression}`);
  log(`Production SQL: ${row.production_sql_expression}`);
  log(`Current Value: ${row.value}`);
});

// Try to connect to P21 database using Windows Authentication
async function checkP21TableStructure() {
  log('\nAttempting to connect to P21 database to check table structure...');
  
  try {
    log('Using Windows Authentication with ODBC');
    const connectionString = 'DSN=P21;Trusted_Connection=Yes';
    const connection = await odbc.connect(connectionString);
    
    // Check if the ar_open_items table exists and get its structure
    log('Checking if ar_open_items table exists...');
    
    try {
      // First try with dbo schema
      const tableQuery = `
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'ar_open_items'
        ORDER BY ORDINAL_POSITION
      `;
      
      log('Executing query: ' + tableQuery);
      const tableResult = await connection.query(tableQuery);
      
      if (tableResult && tableResult.length > 0) {
        log('\nTable structure for ar_open_items:');
        tableResult.forEach(col => {
          log(`${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
        });
        
        // Check if the days_past_due and open_amount columns exist
        const hasDaysPastDue = tableResult.some(col => col.COLUMN_NAME.toLowerCase() === 'days_past_due');
        const hasOpenAmount = tableResult.some(col => col.COLUMN_NAME.toLowerCase() === 'open_amount');
        
        log(`\nRequired columns check:`);
        log(`days_past_due column exists: ${hasDaysPastDue}`);
        log(`open_amount column exists: ${hasOpenAmount}`);
        
        if (!hasDaysPastDue || !hasOpenAmount) {
          log('\nSome required columns are missing. Checking for similar columns...');
          
          // List columns that might be similar to days_past_due
          const daysPastDueSimilar = tableResult
            .filter(col => col.COLUMN_NAME.toLowerCase().includes('day') || 
                          col.COLUMN_NAME.toLowerCase().includes('age') || 
                          col.COLUMN_NAME.toLowerCase().includes('due'))
            .map(col => col.COLUMN_NAME);
          
          // List columns that might be similar to open_amount
          const openAmountSimilar = tableResult
            .filter(col => col.COLUMN_NAME.toLowerCase().includes('amount') || 
                          col.COLUMN_NAME.toLowerCase().includes('balance') || 
                          col.COLUMN_NAME.toLowerCase().includes('value'))
            .map(col => col.COLUMN_NAME);
          
          log(`Columns similar to days_past_due: ${daysPastDueSimilar.join(', ') || 'None found'}`);
          log(`Columns similar to open_amount: ${openAmountSimilar.join(', ') || 'None found'}`);
        }
        
        // Try to get a sample of data from the table
        log('\nAttempting to get a sample of data from ar_open_items...');
        try {
          const sampleQuery = `SELECT TOP 5 * FROM dbo.ar_open_items`;
          const sampleResult = await connection.query(sampleQuery);
          
          if (sampleResult && sampleResult.length > 0) {
            log(`Found ${sampleResult.length} sample records`);
            log('Column names in the result:');
            log(Object.keys(sampleResult[0]).join(', '));
          } else {
            log('No sample data found in ar_open_items');
          }
        } catch (sampleError) {
          log(`Error getting sample data: ${sampleError.message}`);
        }
      } else {
        log('No columns found for ar_open_items table');
        
        // Check if the table exists under a different name
        log('\nChecking for tables with similar names...');
        const tablesQuery = `
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_NAME LIKE '%ar%' AND TABLE_NAME LIKE '%open%'
          OR TABLE_NAME LIKE '%ar%' AND TABLE_NAME LIKE '%aging%'
          OR TABLE_NAME LIKE '%receivable%' AND TABLE_NAME LIKE '%open%'
        `;
        
        const tablesResult = await connection.query(tablesQuery);
        
        if (tablesResult && tablesResult.length > 0) {
          log('Found tables with similar names:');
          tablesResult.forEach(table => {
            log(table.TABLE_NAME);
          });
        } else {
          log('No tables with similar names found');
        }
      }
    } catch (tableError) {
      log(`Error checking table structure: ${tableError.message}`);
    }
    
    // Close the connection
    await connection.close();
    
  } catch (error) {
    log(`Error connecting to P21 database: ${error.message}`);
  }
}

// Run the P21 table structure check
checkP21TableStructure().then(() => {
  log('\nCheck completed');
}).catch(err => {
  log(`Error in main process: ${err.message}`);
});
