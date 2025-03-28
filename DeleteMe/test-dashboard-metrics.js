/**
 * Dashboard Metrics Test Script
 * This script tests all the dashboard metrics using the updated connection manager
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Dashboard queries from memory
const dashboardQueries = [
  {
    name: "Total Orders",
    query: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    name: "Open Orders",
    query: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    name: "Open Orders 2",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'"
  },
  {
    name: "Daily Revenue",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    name: "Open Invoices",
    query: "SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    name: "Orders Backlogged",
    query: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    name: "Total Monthly Sales",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())"
  }
];

// Function to execute a query with detailed error handling
async function executeQueryWithDetails(connection, query) {
  try {
    console.log(`Executing query: ${query}`);
    const startTime = Date.now();
    const result = await connection.query(query);
    const duration = Date.now() - startTime;
    
    console.log(`Query executed in ${duration}ms`);
    
    if (!result) {
      return { success: false, error: 'Query returned null result', result: null };
    }
    
    if (!Array.isArray(result)) {
      return { 
        success: false, 
        error: `Query returned non-array result of type ${typeof result}`, 
        result 
      };
    }
    
    if (result.length === 0) {
      return { success: false, error: 'Query returned empty array', result: [] };
    }
    
    return { success: true, result, duration };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      stack: error.stack,
      sqlState: error.sqlState,
      code: error.code
    };
  }
}

// Function to extract value from query result
function extractValueFromResult(result) {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return { success: false, value: null, error: 'No result data' };
  }
  
  const firstRow = result[0];
  
  // Try to find a 'value' column (case insensitive)
  const valueKey = Object.keys(firstRow).find(key => key.toLowerCase() === 'value');
  
  if (valueKey) {
    const rawValue = firstRow[valueKey];
    
    // Handle different value types
    if (typeof rawValue === 'number') {
      return { success: true, value: rawValue, type: 'number' };
    } else if (rawValue !== null && rawValue !== undefined) {
      // Try to convert string values to numbers
      const parsedValue = parseFloat(String(rawValue));
      if (!isNaN(parsedValue)) {
        return { success: true, value: parsedValue, type: 'parsed-number' };
      } else {
        // Return the string value if it can't be parsed as a number
        return { success: true, value: String(rawValue), type: 'string' };
      }
    } else {
      // Handle null/undefined values
      return { success: false, value: 0, type: 'null', error: 'Value is null or undefined' };
    }
  } else {
    // If no 'value' column, use the first column
    const firstKey = Object.keys(firstRow)[0];
    const rawValue = firstRow[firstKey];
    
    // Handle different value types
    if (typeof rawValue === 'number') {
      return { success: true, value: rawValue, column: firstKey, type: 'number' };
    } else if (rawValue !== null && rawValue !== undefined) {
      // Try to convert string values to numbers
      const parsedValue = parseFloat(String(rawValue));
      if (!isNaN(parsedValue)) {
        return { success: true, value: parsedValue, column: firstKey, type: 'parsed-number' };
      } else {
        // Return the string value if it can't be parsed as a number
        return { success: true, value: String(rawValue), column: firstKey, type: 'string' };
      }
    } else {
      // Handle null/undefined values
      return { success: false, value: 0, column: firstKey, type: 'null', error: 'Value is null or undefined' };
    }
  }
}

// Function to ensure query has proper schema prefixes
function addSchemaPrefix(query) {
  if (!query.includes('dbo.')) {
    // Common P21 table names to add schema prefix to
    const p21Tables = [
      'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
      'customer', 'inv_mast', 'ar_open_items', 'ap_open_items'
    ];
    
    // Add dbo. prefix to each table name
    let modifiedQuery = query;
    p21Tables.forEach(tableName => {
      // Use regex to match table names that aren't already prefixed
      const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'g');
      modifiedQuery = modifiedQuery.replace(regex, `dbo.${tableName}`);
    });
    
    return modifiedQuery;
  }
  
  return query;
}

// Main function to test the dashboard metrics
async function testDashboardMetrics() {
  console.log('=== Dashboard Metrics Test ===');
  console.log('Starting test at', new Date().toISOString());
  
  // Output file for results
  const outputFile = path.join(process.cwd(), `dashboard-metrics-test-${Date.now()}.txt`);
  let output = '';
  
  // Helper function to append to output
  const log = (text) => {
    output += text + '\n';
    console.log(text);
  };
  
  try {
    // Connect to P21 database
    log('\n--- P21 Connection Test ---');
    
    // Get DSN and credentials from environment variables or use defaults
    const dsn = process.env.P21_DSN || 'P21Play';
    
    // Build connection string with Windows Authentication
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    log('Connection string: ' + connectionString);
    
    log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    try {
      // Test server and database information
      log('\n--- Server Information ---');
      const serverInfoResult = await connection.query("SELECT @@SERVERNAME AS server_name, DB_NAME() AS database_name");
      if (serverInfoResult && serverInfoResult.length > 0) {
        log(`Server: ${serverInfoResult[0].server_name}`);
        log(`Database: ${serverInfoResult[0].database_name}`);
      } else {
        log('❌ Failed to get server information');
      }
      
      // Test each dashboard metric
      log('\n--- Dashboard Metrics Test ---');
      
      const results = [];
      
      for (const queryInfo of dashboardQueries) {
        log(`\n--- ${queryInfo.name} ---`);
        
        // Add schema prefix if needed
        const modifiedQuery = addSchemaPrefix(queryInfo.query);
        log(`Query: ${modifiedQuery}`);
        
        const queryResult = await executeQueryWithDetails(connection, modifiedQuery);
        
        if (queryResult.success) {
          log(`✅ Query executed successfully in ${queryResult.duration}ms`);
          
          const valueResult = extractValueFromResult(queryResult.result);
          
          if (valueResult.success) {
            log(`✅ Value: ${valueResult.value} (type: ${valueResult.type}${valueResult.column ? ', column: ' + valueResult.column : ''})`);
            
            // Check if the value is zero
            if (valueResult.value === 0 || valueResult.value === '0') {
              log(`⚠️ WARNING: Query returned zero value!`);
            } else {
              log(`✅ SUCCESS: Query returned non-zero value: ${valueResult.value}`);
            }
            
            // Add to results
            results.push({
              name: queryInfo.name,
              query: modifiedQuery,
              value: valueResult.value,
              type: valueResult.type,
              success: true
            });
          } else {
            log(`❌ Failed to extract value: ${valueResult.error}`);
            
            // Add to results
            results.push({
              name: queryInfo.name,
              query: modifiedQuery,
              value: null,
              error: valueResult.error,
              success: false
            });
          }
          
          log(`Raw result: ${JSON.stringify(queryResult.result[0])}`);
        } else {
          log(`❌ Query execution failed: ${queryResult.error}`);
          if (queryResult.stack) {
            log(`Stack: ${queryResult.stack}`);
          }
          if (queryResult.sqlState) {
            log(`SQL State: ${queryResult.sqlState}, Code: ${queryResult.code}`);
          }
          
          // Add to results
          results.push({
            name: queryInfo.name,
            query: modifiedQuery,
            value: null,
            error: queryResult.error,
            success: false
          });
        }
      }
      
      // Summary of results
      log('\n--- Results Summary ---');
      log(`Total metrics tested: ${results.length}`);
      log(`Successful metrics: ${results.filter(r => r.success).length}`);
      log(`Failed metrics: ${results.filter(r => !r.success).length}`);
      
      log('\nMetric values:');
      results.forEach(result => {
        if (result.success) {
          log(`- ${result.name}: ${result.value}`);
        } else {
          log(`- ${result.name}: ERROR - ${result.error}`);
        }
      });
      
      // Save results to JSON file
      const jsonFile = path.join(process.cwd(), `dashboard-metrics-results-${Date.now()}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
      log(`\nResults saved to JSON file: ${jsonFile}`);
    } finally {
      // Close the connection
      await connection.close();
      log('\n--- Connection closed ---');
    }
    
    // Write output to file
    fs.writeFileSync(outputFile, output);
    log(`\nResults saved to ${outputFile}`);
    
  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`);
    log(error.stack);
    
    // Write output to file even if there was an error
    fs.writeFileSync(outputFile, output);
    log(`\nResults saved to ${outputFile}`);
  }
}

// Run the test
testDashboardMetrics().catch(error => {
  console.error('Unhandled error:', error);
});
