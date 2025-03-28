// Test script to verify SQL execution with fresh connections
// Use dynamic import for ES modules
const fs = require('fs');
const path = require('path');

// Create a log file for the test results
const logFilePath = path.join(__dirname, 'sql-execution-test-results.txt');
const logStream = fs.createWriteStream(logFilePath, { flags: 'w' });

// Helper function to log to both console and file
function log(message) {
  console.log(message);
  logStream.write(message + '\n');
}

// Test queries for P21
const p21Queries = [
  {
    name: 'Total Orders',
    query: 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())'
  },
  {
    name: 'Open Orders',
    query: 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = \'N\''
  },
  {
    name: 'Open Orders Value',
    query: 'SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = \'N\''
  },
  {
    name: 'Daily Revenue',
    query: 'SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))'
  },
  {
    name: 'Open Invoices',
    query: 'SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())'
  }
];

// Main test function
async function runTests() {
  log('=== SQL Execution Test ===');
  log(`Starting test at ${new Date().toISOString()}`);
  log('');

  try {
    // Dynamically import the ConnectionManager
    const { ConnectionManager } = await import('./lib/db/connection-manager.js');
    
    // Test P21 queries
    log('--- Testing P21 Queries with Fresh Connection ---');
    
    const p21Config = {
      type: 'P21',
      dsn: process.env.P21_DSN || 'P21Play',
      username: process.env.P21_USERNAME,
      password: process.env.P21_PASSWORD
    };

    log(`Using P21 DSN: ${p21Config.dsn}`);
    log(`Using authentication: ${p21Config.username ? 'SQL Server Auth' : 'Windows Auth'}`);
    log('');

    // Test each P21 query
    for (const testQuery of p21Queries) {
      log(`Testing query: ${testQuery.name}`);
      log(`SQL: ${testQuery.query}`);
      
      try {
        const startTime = Date.now();
        const result = await ConnectionManager.executeQueryWithFreshConnection(p21Config, testQuery.query);
        const duration = Date.now() - startTime;
        
        log(`Execution time: ${duration}ms`);
        
        if (result) {
          log(`Result: ${JSON.stringify(result)}`);
          
          // Check if the result has a value property
          if (typeof result === 'object' && 'value' in result) {
            const value = result.value;
            log(`Extracted value: ${value} (type: ${typeof value})`);
            
            // Check if the value is zero
            if (value === 0 || value === '0') {
              log(`WARNING: Query returned zero value!`);
            } else {
              log(`SUCCESS: Query returned non-zero value: ${value}`);
            }
          } else if (Array.isArray(result) && result.length > 0) {
            const firstRow = result[0];
            log(`First row: ${JSON.stringify(firstRow)}`);
            
            // Try to extract a value from the first row
            const keys = Object.keys(firstRow);
            if (keys.length > 0) {
              const firstKey = keys[0];
              const firstValue = firstRow[firstKey];
              log(`First column (${firstKey}): ${firstValue} (type: ${typeof firstValue})`);
              
              // Check if the value is zero
              if (firstValue === 0 || firstValue === '0') {
                log(`WARNING: Query returned zero value!`);
              } else {
                log(`SUCCESS: Query returned non-zero value: ${firstValue}`);
              }
            }
          } else {
            log(`WARNING: Unexpected result format: ${typeof result}`);
          }
        } else {
          log(`WARNING: Query returned null or undefined result`);
        }
      } catch (error) {
        log(`ERROR: ${error.message}`);
        log(`Stack: ${error.stack}`);
      }
      
      log('---');
    }
  } catch (importError) {
    log(`IMPORT ERROR: ${importError.message}`);
    log(`Stack: ${importError.stack}`);
  }

  log('');
  log('Test completed at ' + new Date().toISOString());
  log(`Results saved to ${logFilePath}`);
  
  // Close the log file
  logStream.end();
}

// Run the tests
runTests().catch(error => {
  log(`FATAL ERROR: ${error.message}`);
  log(`Stack: ${error.stack}`);
  logStream.end();
});
