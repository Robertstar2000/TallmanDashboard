// Test script to verify P21 SQL queries using ODBC
const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Create a log file for the test results
const logFilePath = path.join(__dirname, 'p21-query-test-results.txt');
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

// Execute a query using ODBC
async function executeP21Query(query) {
  // Get DSN and credentials from environment variables
  const dsn = process.env.P21_DSN || 'P21Play';
  const username = process.env.P21_USERNAME;
  const password = process.env.P21_PASSWORD;
  
  // Build connection string
  let connectionString = `DSN=${dsn};`;
  
  // Add authentication details if provided
  if (username && password) {
    connectionString += `UID=${username};PWD=${password};`;
    log('Using SQL Server Authentication with ODBC');
  } else {
    // Use Windows Authentication
    connectionString += 'Trusted_Connection=Yes;';
    log('Using Windows Authentication with ODBC');
  }
  
  log(`Creating ODBC connection with DSN: ${dsn}`);
  
  // Create a new connection
  const connection = await odbc.connect(connectionString);
  
  try {
    // Execute the query
    log(`Executing query: ${query}`);
    const result = await connection.query(query);
    log(`Query result: ${JSON.stringify(result)}`);
    
    return result;
  } finally {
    // Always close the connection
    await connection.close();
    log('ODBC connection closed');
  }
}

// Main test function
async function runTests() {
  log('=== P21 Query Test ===');
  log(`Starting test at ${new Date().toISOString()}`);
  log('');
  
  // Test each P21 query
  for (const testQuery of p21Queries) {
    log(`Testing query: ${testQuery.name}`);
    log(`SQL: ${testQuery.query}`);
    
    try {
      const startTime = Date.now();
      const result = await executeP21Query(testQuery.query);
      const duration = Date.now() - startTime;
      
      log(`Execution time: ${duration}ms`);
      
      if (result) {
        // Check if the result is an array
        if (Array.isArray(result) && result.length > 0) {
          const firstRow = result[0];
          log(`First row: ${JSON.stringify(firstRow)}`);
          
          // Try to find a 'value' column
          const valueKey = Object.keys(firstRow).find(key => key.toLowerCase() === 'value');
          
          if (valueKey) {
            const value = firstRow[valueKey];
            log(`Found 'value' column with value: ${value} (type: ${typeof value})`);
            
            // Check if the value is zero
            if (value === 0 || value === '0') {
              log(`WARNING: Query returned zero value!`);
            } else {
              log(`SUCCESS: Query returned non-zero value: ${value}`);
            }
          } else {
            // If no 'value' column, use the first column
            const firstKey = Object.keys(firstRow)[0];
            const firstValue = firstRow[firstKey];
            log(`Using first column '${firstKey}' with value: ${firstValue} (type: ${typeof firstValue})`);
            
            // Check if the value is zero
            if (firstValue === 0 || firstValue === '0') {
              log(`WARNING: Query returned zero value!`);
            } else {
              log(`SUCCESS: Query returned non-zero value: ${firstValue}`);
            }
          }
        } else {
          log(`WARNING: Query returned empty result or non-array result: ${JSON.stringify(result)}`);
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
