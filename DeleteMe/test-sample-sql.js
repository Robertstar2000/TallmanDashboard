const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Create a log file with timestamp
const logFile = path.join(logDir, `sql-sample-test-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Function to log messages to both console and file
function log(message) {
  console.log(message);
  logStream.write(message + '\n');
}

log(`Log file created at: ${logFile}`);

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Function to test a SQL expression against a server
async function testSqlExpression(server, sql) {
  log(`Testing SQL expression on ${server}:`);
  log(sql);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    const response = await fetch(`${BASE_URL}/api/admin/test-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server,
        sql,
        testMode: false
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Error: ${response.status} - ${errorText}`);
      return { success: false, isNonZero: false, error: errorText, availableTables: [] };
    }
    
    const data = await response.json();
    log(`Result: ${JSON.stringify(data)}`);
    
    if (data.error) {
      log(`SQL Error: ${data.error}`);
      return { success: false, isNonZero: false, error: data.error, availableTables: data.availableTables || [] };
    }
    
    // Check if the result is non-zero
    const isNonZero = checkNonZeroResult(data.value);
    
    if (isNonZero) {
      log('✅ SQL expression returned non-zero result');
    } else {
      log('⚠️ SQL expression returned zero result');
    }
    
    return { success: true, isNonZero, value: data.value, availableTables: data.availableTables || [] };
  } catch (error) {
    if (error.name === 'AbortError') {
      log('❌ SQL expression timed out after 30 seconds');
      return { success: false, isNonZero: false, error: 'Timeout', availableTables: [] };
    }
    
    log(`❌ Error testing SQL expression: ${error.message}`);
    return { success: false, isNonZero: false, error: error.message, availableTables: [] };
  }
}

// Function to check if a result is non-zero
function checkNonZeroResult(value) {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  if (typeof value === 'string') {
    return value.trim() !== '' && value !== '0';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => checkNonZeroResult(item));
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length > 0 && Object.values(value).some(item => checkNonZeroResult(item));
  }
  
  return false;
}

// Sample SQL expressions to test
const sampleExpressions = [
  {
    name: 'AR Aging - Current - Amount Due',
    serverName: 'P21',
    sqlExpression: 'SELECT SUM(amount_due) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE aging_bucket = 0'
  },
  {
    name: 'Accounts - January - Payable',
    serverName: 'P21',
    sqlExpression: 'SELECT SUM(amount_due) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE MONTH(invoice_date) = 1 AND YEAR(invoice_date) = YEAR(GETDATE())'
  },
  {
    name: 'Customer Metrics - January - New',
    serverName: 'P21',
    sqlExpression: 'SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK) WHERE MONTH(creation_date) = 1 AND YEAR(creation_date) = YEAR(GETDATE())'
  },
  {
    name: 'POR Overview - January - New Rentals',
    serverName: 'POR',
    sqlExpression: 'SELECT Count(*) as value FROM Rentals WHERE Status = "New" AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())'
  },
  {
    name: 'POR Overview - January - Open Rentals',
    serverName: 'POR',
    sqlExpression: 'SELECT Count(*) as value FROM Rentals WHERE Status = "Open" AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())'
  }
];

// Main function
async function main() {
  try {
    log('Starting SQL expression sample testing...');
    
    // Check if the server is running
    try {
      const response = await fetch(`${BASE_URL}/api/health-check`);
      if (!response.ok) {
        log('❌ Server is not running. Please start the server with "npm run dev" first.');
        return;
      }
      log('✅ Server is running and ready to process requests.');
    } catch (error) {
      log('❌ Server is not running. Please start the server with "npm run dev" first.');
      return;
    }
    
    log(`Found ${sampleExpressions.length} sample SQL expressions to test`);
    
    // Track statistics
    let successCount = 0;
    let failureCount = 0;
    let nonZeroCount = 0;
    let zeroCount = 0;
    
    // Process each sample expression
    for (let i = 0; i < sampleExpressions.length; i++) {
      const row = sampleExpressions[i];
      log(`\n[${i + 1}/${sampleExpressions.length}] Testing SQL expression for: ${row.name}`);
      
      // Test the SQL expression
      const result = await testSqlExpression(row.serverName, row.sqlExpression);
      
      // Update statistics
      if (result.success) {
        successCount++;
        if (result.isNonZero) {
          nonZeroCount++;
          log('✅ SQL expression is successful with non-zero result!');
        } else {
          zeroCount++;
          log('⚠️ SQL expression is successful but returns zero result.');
        }
      } else {
        failureCount++;
        log('❌ SQL expression failed.');
      }
      
      // Add a delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final summary
    log(`\n===== FINAL SUMMARY =====`);
    log(`Total expressions tested: ${sampleExpressions.length}`);
    log(`Successful queries: ${successCount} (${Math.round(successCount / sampleExpressions.length * 100)}%)`);
    log(`Failed queries: ${failureCount} (${Math.round(failureCount / sampleExpressions.length * 100)}%)`);
    log(`Non-zero results: ${nonZeroCount} (${Math.round(nonZeroCount / sampleExpressions.length * 100)}%)`);
    log(`Zero results: ${zeroCount} (${Math.round(zeroCount / sampleExpressions.length * 100)}%)`);
    
    log('\nSQL expression sample testing complete!');
    log(`Log file saved at: ${logFile}`);
    
    // Close the log file
    logStream.end();
  } catch (error) {
    log(`Error in main execution: ${error.message}`);
    log(error.stack);
    
    // Close the log file
    logStream.end();
  }
}

// Run the main function
main();
