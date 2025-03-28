const odbc = require('odbc');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to test the Customer Metrics SQL queries directly against P21
 */
async function testCustomerMetricsQueries() {
  console.log('=== Testing Customer Metrics SQL Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the P21 database
    console.log('\n--- Connecting to P21 database ---');
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21 database');
    
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
    
    // Get the Customer Metrics rows from the SQLite database
    const customerMetricsRows = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, 
             sql_expression as sqlExpression, production_sql_expression as productionSqlExpression,
             server_name as serverName
      FROM chart_data
      WHERE chart_group = 'Customer Metrics'
      ORDER BY id
    `);
    
    console.log(`\nFound ${customerMetricsRows.length} Customer Metrics rows in SQLite database`);
    
    // Group the rows by variable name
    const rowsByVariable = {};
    customerMetricsRows.forEach(row => {
      const variableName = row.variableName.split(' ')[0]; // Get the base variable name (New, Prospects)
      if (!rowsByVariable[variableName]) {
        rowsByVariable[variableName] = [];
      }
      rowsByVariable[variableName].push(row);
    });
    
    console.log('\n--- Variable groups ---');
    Object.keys(rowsByVariable).forEach(variable => {
      console.log(`${variable}: ${rowsByVariable[variable].length} rows`);
    });
    
    // Test a few sample queries
    console.log('\n--- Testing SQL queries ---');
    
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
      console.log(`SQL: ${row.productionSqlExpression}`);
      
      try {
        const result = await connection.query(row.productionSqlExpression);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
        } else {
          console.log('⚠️ Query executed but returned no results');
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
      }
    }
    
    // Close the connections
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
    await db.close();
    console.log('✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== Customer Metrics SQL Queries Testing Completed ===');
}

// Run the test function
testCustomerMetricsQueries()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
