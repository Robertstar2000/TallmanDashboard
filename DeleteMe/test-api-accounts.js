const http = require('http');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to test the Accounts SQL queries through the API endpoint
 */
async function testApiAccountsQueries() {
  console.log('=== Testing Accounts SQL Queries via API ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database to get the SQL expressions
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Get the Accounts rows from the SQLite database
    const accountsRows = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, 
             sql_expression as sqlExpression, production_sql_expression as productionSqlExpression,
             server_name as serverName
      FROM chart_data
      WHERE chart_group = 'Accounts'
      ORDER BY id
    `);
    
    console.log(`\nFound ${accountsRows.length} Accounts rows in SQLite database`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    accountsRows.forEach(row => {
      const variableName = row.variableName.split(' ')[0]; // Get the base variable name (Payable, Receivable, Overdue)
      if (!rowsByVariable[variableName]) {
        rowsByVariable[variableName] = [];
      }
      rowsByVariable[variableName].push(row);
    });
    
    console.log('\n--- Variable groups ---');
    Object.keys(rowsByVariable).forEach(variable => {
      console.log(`${variable}: ${rowsByVariable[variable].length} rows`);
    });
    
    // Test a few sample queries through the API endpoint
    console.log('\n--- Testing SQL queries via API endpoint ---');
    
    // Get one sample row for each variable type
    const sampleRows = [];
    Object.keys(rowsByVariable).forEach(variable => {
      if (rowsByVariable[variable].length > 0) {
        sampleRows.push(rowsByVariable[variable][0]);
      }
    });
    
    // Test each sample row
    for (const row of sampleRows) {
      console.log(`\nTesting: ${row.variableName}`);
      console.log(`SQL Expression: ${row.sqlExpression}`);
      console.log(`Production SQL Expression: ${row.productionSqlExpression}`);
      
      try {
        // Call the API endpoint using http module
        const data = JSON.stringify({
          server: row.serverName,
          query: row.productionSqlExpression
        });
        
        // Create a promise to handle the http request
        const result = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/executeQuery',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': data.length
            }
          };
          
          const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            
            res.on('end', () => {
              try {
                const jsonResponse = JSON.parse(responseData);
                resolve(jsonResponse);
              } catch (error) {
                reject(new Error(`Failed to parse response: ${error.message}`));
              }
            });
          });
          
          req.on('error', (error) => {
            reject(error);
          });
          
          req.write(data);
          req.end();
        });
        
        console.log('API Response:', JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log('✅ API call successful');
          if (result.data && result.data.length > 0) {
            console.log('Result value:', result.data[0].value);
          } else {
            console.log('⚠️ No data returned');
          }
        } else {
          console.log('❌ API call failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error calling API:', error.message);
      }
    }
    
    // Close the SQLite connection
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== Accounts SQL Queries API Testing Completed ===');
}

// Run the test function
testApiAccountsQueries()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
