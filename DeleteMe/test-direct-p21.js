// Test script to verify direct SQL Server connection to P21
// This script uses the mssql package directly without relying on the ConnectionManager

// Import required modules
const sql = require('mssql');

// Test SQL query
const TEST_SQL = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";

// Function to test P21 connection
async function testP21Connection() {
  console.log('Testing direct P21 connection...');
  
  try {
    // Create a SQL Server configuration for P21
    const sqlConfig = {
      server: '10.10.20.28', // Direct SQL Server address
      database: 'P21Play',
      user: 'sa',
      password: 'Ted@Admin230', // Using the password from the existing test script
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true
      }
    };
    
    console.log('Connecting to P21 database with configuration:', JSON.stringify(sqlConfig, null, 2));
    
    // Create a new connection pool
    const pool = new sql.ConnectionPool(sqlConfig);
    
    // Attempt to connect
    console.log('Attempting to connect...');
    await pool.connect();
    console.log('Connected successfully!');
    
    // Test a simple query
    console.log('Executing version query...');
    const versionResult = await pool.request().query('SELECT @@VERSION as version');
    console.log('SQL Server version:', versionResult.recordset[0].version.split('\n')[0]);
    
    // Execute the test query
    console.log('Executing test query:', TEST_SQL);
    const queryResult = await pool.request().query(TEST_SQL);
    console.log('Query result:', queryResult.recordset);
    
    // Close the connection
    console.log('Closing connection...');
    await pool.close();
    console.log('Connection closed successfully.');
    
    return true;
  } catch (error) {
    console.error('Error testing P21 connection:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run the test
testP21Connection().then(success => {
  console.log('Test completed with ' + (success ? 'success' : 'failure'));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
