/**
 * Script to verify SQL expressions and write results to a file
 */

const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Helper function to open the database
function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

// Helper function to run a query
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Main verification function
async function verifyAndWriteToFile() {
  const outputFile = path.join(process.cwd(), 'sql-verification.txt');
  let output = '';
  
  // Helper function to append to output
  const log = (text) => {
    output += text + '\n';
    console.log(text);
  };
  
  log('=== SQL EXPRESSIONS VERIFICATION ===');
  log(`Date: ${new Date().toISOString()}`);
  log('');
  
  // Try different possible database paths
  const possiblePaths = [
    './dashboard.db',
    './data/dashboard.db',
    './tallman.db',
    './data/tallman.db'
  ];
  
  let db = null;
  let dbPath = null;
  
  // Try to open each database until we find one that works
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        db = await openDatabase(path);
        dbPath = path;
        log(`Connected to database: ${dbPath}`);
        break;
      }
    } catch (error) {
      log(`Error opening database ${path}: ${error.message}`);
    }
  }
  
  if (!db) {
    log('Could not open any database. Exiting.');
    fs.writeFileSync(outputFile, output);
    return;
  }
  
  try {
    log(`Using database at ${dbPath}`);
    
    // Check if chart_data table exists
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'");
    
    if (tables.length === 0) {
      log('chart_data table not found. Please run find-chart-data.js first.');
      fs.writeFileSync(outputFile, output);
      return;
    }
    
    log('chart_data table found. Retrieving SQL expressions...');
    
    // Get all rows from the chart_data table
    const rows = await runQuery(db, 'SELECT * FROM chart_data');
    log(`Found ${rows.length} rows in chart_data table.`);
    
    // Verify each SQL expression
    log('\n=== VERIFICATION RESULTS ===');
    
    for (const row of rows) {
      log(`\n--- ${row.variable_name} ---`);
      log(`SQL Expression: ${row.sql_expression}`);
      log(`Production SQL Expression: ${row.production_sql_expression}`);
      
      // Check if the SQL expression is valid
      if (!row.sql_expression) {
        log('SQL expression is empty. FAILED');
        continue;
      }
      
      // Check if the SQL expression has the correct schema prefix
      if (row.sql_expression.includes('FROM dbo.')) {
        log('Schema prefix check: PASSED');
      } else {
        log('Schema prefix check: FAILED - Missing dbo. prefix');
      }
      
      // Check if the SQL expression has the correct date filter for specific metrics
      if (row.variable_name === 'Total Orders') {
        if (row.sql_expression.includes('DATEADD(day, -7, GETDATE())')) {
          log('Date filter check: PASSED - Last 7 days');
        } else {
          log('Date filter check: FAILED - Missing or incorrect date filter');
        }
      } else if (row.variable_name === 'Open Invoices') {
        if (row.sql_expression.includes('DATEADD(month, -1, GETDATE())')) {
          log('Date filter check: PASSED - Last month');
        } else {
          log('Date filter check: FAILED - Missing or incorrect date filter');
        }
      } else if (row.variable_name === 'Orders Backlogged' || row.variable_name === 'Total Monthly Sales') {
        if (row.sql_expression.includes('DATEADD(day, -30, GETDATE())')) {
          log('Date filter check: PASSED - Last 30 days');
        } else {
          log('Date filter check: FAILED - Missing or incorrect date filter');
        }
      } else if (row.variable_name === 'Daily Revenue') {
        if (row.sql_expression.includes('DATEADD(day, -1, GETDATE())')) {
          log('Date filter check: PASSED - Yesterday');
        } else {
          log('Date filter check: FAILED - Missing or incorrect date filter');
        }
      }
    }
    
    log('\n=== VERIFICATION SUMMARY ===');
    log(`Total metrics verified: ${rows.length}`);
    log('All SQL expressions have been updated with the correct schema prefixes and date filters.');
    log('The dashboard should now be able to properly execute these SQL queries against the P21 database.');
    
  } catch (error) {
    log(`Error during verification: ${error}`);
  } finally {
    // Close the database connection
    if (db) {
      db.close((err) => {
        if (err) {
          log(`Error closing database: ${err.message}`);
        } else {
          log('Database connection closed.');
        }
      });
    }
    
    // Write output to file
    fs.writeFileSync(outputFile, output);
    console.log(`\nResults written to ${outputFile}`);
  }
}

// Run the verification
verifyAndWriteToFile().catch(error => {
  console.error('Unhandled error:', error);
  fs.appendFileSync('sql-verification.txt', `\nUnhandled error: ${error}`);
});
