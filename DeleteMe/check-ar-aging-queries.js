// Script to check AR Aging SQL expressions against the external P21 database
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the local SQLite database
const localDb = new Database('./data/dashboard.db');

// Function to test P21 connection and execute queries
async function testP21Queries() {
  const outputFile = './ar-aging-test-results.txt';
  let output = '';

  function log(message) {
    console.log(message);
    output += message + '\n';
  }

  try {
    log('Starting AR Aging query test against P21 database...');
    
    // Get AR Aging queries from local database
    const arAgingRows = localDb.prepare(`
      SELECT id, chart_group, variable_name, server_name, production_sql_expression 
      FROM chart_data 
      WHERE chart_group = 'AR Aging'
    `).all();
    
    if (arAgingRows.length === 0) {
      log('No AR Aging rows found in the database.');
      fs.writeFileSync(outputFile, output);
      return;
    }
    
    log(`Found ${arAgingRows.length} AR Aging rows to test.`);
    
    // Load ODBC module
    const odbc = require('odbc');
    
    // Use the DSN from environment or default to P21Play
    const dsn = process.env.P21_DSN || 'P21Play';
    log(`Using ODBC DSN: ${dsn}`);
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    log(`ODBC connection string: ${connectionString}`);
    
    log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    log('Connected successfully to ODBC data source!');
    
    // Test each AR Aging query
    for (const row of arAgingRows) {
      log(`\nTesting query for ${row.variable_name}:`);
      
      if (!row.production_sql_expression) {
        log(`No production SQL expression defined for ${row.variable_name}, skipping.`);
        continue;
      }
      
      const sql = row.production_sql_expression.trim();
      log(`SQL: ${sql}`);
      
      try {
        // Execute the query
        const startTime = Date.now();
        const result = await connection.query(sql);
        const endTime = Date.now();
        
        log(`Query executed successfully in ${endTime - startTime}ms.`);
        
        if (result && result.length > 0) {
          const firstRow = result[0];
          log(`Result: ${JSON.stringify(firstRow)}`);
          
          // Check if the result has a 'value' property
          if ('value' in firstRow) {
            log(`Value: ${firstRow.value}`);
          } else {
            // Try to find a value in the first column
            const keys = Object.keys(firstRow);
            if (keys.length > 0) {
              const firstValue = firstRow[keys[0]];
              log(`First column value (${keys[0]}): ${firstValue}`);
            } else {
              log('No value found in result.');
            }
          }
        } else {
          log('Query returned no results.');
        }
      } catch (error) {
        log(`Error executing query: ${error.message}`);
        
        // Check for specific error types
        if (error.message.includes('ODBC')) {
          log('This appears to be an ODBC connection error.');
        } else if (error.message.includes('syntax')) {
          log('This appears to be a SQL syntax error.');
        }
        
        // Suggest a fix based on the error
        log('Suggested fix:');
        if (error.message.includes('Invalid object name')) {
          const tableName = error.message.match(/'([^']+)'/);
          if (tableName && tableName[1]) {
            log(`- Check if the table name '${tableName[1]}' is correct and accessible.`);
            log(`- Make sure the table name has the correct schema prefix (e.g., dbo.${tableName[1]}).`);
          }
        } else if (error.message.includes('Invalid column name')) {
          const columnName = error.message.match(/'([^']+)'/);
          if (columnName && columnName[1]) {
            log(`- Check if the column name '${columnName[1]}' is correct.`);
          }
        } else {
          log('- Check the SQL syntax and ensure all tables and columns exist.');
          log('- Verify that the SQL Server instance has the expected schema.');
        }
      }
    }
    
    // Close the connection
    await connection.close();
    log('\nConnection closed. Test completed.');
    
  } catch (error) {
    log(`\nError in test script: ${error.message}`);
    if (error.stack) {
      log(`Stack trace: ${error.stack}`);
    }
  } finally {
    // Close the local database connection
    localDb.close();
    
    // Write output to file
    fs.writeFileSync(outputFile, output);
    console.log(`Results written to ${outputFile}`);
  }
}

// Run the test
testP21Queries().catch(err => {
  console.error('Unhandled error:', err);
  fs.appendFileSync('./ar-aging-test-results.txt', `\nUnhandled error: ${err.message}\n${err.stack || ''}`);
});
