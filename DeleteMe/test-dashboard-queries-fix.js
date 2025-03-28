/**
 * Script to test the dashboard queries against the P21 database
 * This will help diagnose why the SQL executions are returning zeros
 */

const odbc = require('odbc');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Dashboard queries from the memory
const dashboardQueries = [
  {
    name: "Total Orders",
    query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    name: "Open Orders",
    query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    name: "Open Orders 2",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'"
  },
  {
    name: "Daily Revenue",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    name: "Open Invoices",
    query: "SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    name: "Orders Backlogged",
    query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    name: "Total Monthly Sales",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())"
  }
];

// Test variations of the queries with different schema prefixes
const schemaVariations = [
  { name: 'Default (dbo)', transform: query => query },
  { name: 'No schema', transform: query => query.replace(/dbo\./g, '') },
  { name: 'P21.dbo schema', transform: query => query.replace(/dbo\./g, 'P21.dbo.') }
];

// Function to get chart data from SQLite database
async function getChartDataFromSQLite() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(process.cwd(), 'dashboard.db');
    console.log(`Opening SQLite database at ${dbPath}`);
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err);
        reject(err);
        return;
      }
      
      db.all(`
        SELECT 
          id,
          chart_name as "chartName",
          variable_name as "variableName",
          server_name as "serverName",
          db_table_name as "tableName",
          sql_expression as "sqlExpression",
          production_sql_expression as "productionSqlExpression",
          value,
          transformer,
          last_updated as "lastUpdated"
        FROM chart_data
      `, (err, rows) => {
        db.close();
        
        if (err) {
          console.error('Error querying chart_data table:', err);
          reject(err);
          return;
        }
        
        console.log(`Retrieved ${rows.length} rows from chart_data table`);
        resolve(rows);
      });
    });
  });
}

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

// Main function to test the queries
async function testDashboardQueries() {
  console.log('=== Dashboard Queries Test ===');
  console.log('Starting test at', new Date().toISOString());
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Output file for results
  const outputFile = path.join(process.cwd(), `dashboard-queries-test-${Date.now()}.txt`);
  let output = '';
  
  // Helper function to append to output
  const log = (text) => {
    output += text + '\n';
    console.log(text);
  };
  
  try {
    // 1. Get chart data from SQLite database
    log('\n--- SQLite Chart Data ---');
    const chartData = await getChartDataFromSQLite();
    
    log(`Found ${chartData.length} rows in chart_data table`);
    log('Sample chart data:');
    chartData.slice(0, 3).forEach(row => {
      log(`- ${row.chartName} - ${row.variableName}: SQL = ${row.sqlExpression?.substring(0, 50) || 'N/A'}...`);
    });
    
    // 2. Connect to P21 database
    log('\n--- P21 Connection Test ---');
    
    // Get DSN and credentials from environment variables or use defaults
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
    
    log('Connection string: ' + connectionString);
    
    log('Connecting to ODBC data source...');
    let connection;
    try {
      connection = await odbc.connect(connectionString);
      log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    } catch (connError) {
      log(`❌ CONNECTION FAILED: ${connError.message}`);
      log('Detailed error:');
      log(JSON.stringify(connError, null, 2));
      
      // Write output to file even if connection failed
      fs.writeFileSync(outputFile, output);
      log(`\nResults saved to ${outputFile}`);
      return;
    }
    
    // 3. Test each dashboard query with different schema variations
    log('\n--- Dashboard Queries Test ---');
    
    // First test the hard-coded queries
    log('\n=== Testing Hard-Coded Queries ===');
    for (const queryInfo of dashboardQueries) {
      log(`\n--- ${queryInfo.name} ---`);
      log(`Original query: ${queryInfo.query}`);
      
      for (const variation of schemaVariations) {
        const modifiedQuery = variation.transform(queryInfo.query);
        log(`\n${variation.name}:`);
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
          } else {
            log(`❌ Failed to extract value: ${valueResult.error}`);
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
        }
      }
    }
    
    // Then test the queries from the SQLite database
    log('\n=== Testing SQLite Database Queries ===');
    const p21Rows = chartData.filter(row => row.serverName === 'P21' && row.productionSqlExpression);
    
    log(`Found ${p21Rows.length} P21 queries in the SQLite database`);
    
    for (const row of p21Rows) {
      log(`\n--- ${row.chartName} - ${row.variableName} ---`);
      log(`Original query: ${row.productionSqlExpression}`);
      
      // Only test the default schema variation for database queries to save time
      const modifiedQuery = row.productionSqlExpression;
      log(`\nExecuting query:`);
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
        } else {
          log(`❌ Failed to extract value: ${valueResult.error}`);
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
      }
    }
    
    // 4. Close the connection
    await connection.close();
    log('\n--- Connection closed ---');
    
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
testDashboardQueries().catch(error => {
  console.error('Unhandled error:', error);
});
