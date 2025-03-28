// Test script for direct P21 connection
const sql = require('mssql');

async function testP21Connection() {
  console.log('Testing P21 connection using SQL Server authentication...');
  
  try {
    // Create connection configuration for P21
    const config = {
      server: '10.10.20.28', // SQL Server address
      database: 'P21Play',
      user: 'sa', // SQL Server authentication
      password: 'P@ssw0rd', // Default password, should be updated in production
      options: {
        trustServerCertificate: true,
        encrypt: false
      }
    };
    
    console.log('Connecting to SQL Server at 10.10.20.28...');
    
    // Create a new connection pool
    const pool = new sql.ConnectionPool(config);
    
    // Attempt to connect
    await pool.connect();
    
    console.log('Successfully connected to P21Play');
    
    // Test a simple query
    console.log('Executing test query...');
    const result = await pool.request().query('SELECT @@VERSION as version');
    
    console.log('SQL Server version:');
    console.log(result.recordset[0].version);
    
    // Try to query a P21 table
    console.log('\nTesting P21 table access...');
    try {
      const p21Result = await pool.request().query('SELECT TOP 5 * FROM inv_mast');
      console.log('Successfully queried inv_mast table:');
      console.log(p21Result.recordset);
    } catch (tableError) {
      console.error('Error querying P21 table:', tableError.message);
    }
    
    // Close the connection
    await pool.close();
    console.log('Connection closed');
    
    return true;
  } catch (error) {
    console.error('P21 connection test failed:');
    console.error(error.message);
    return false;
  }
}

// Run the test
testP21Connection()
  .then(success => {
    if (success) {
      console.log('P21 connection test completed successfully');
    } else {
      console.log('P21 connection test failed');
    }
  })
  .catch(err => {
    console.error('Unhandled error in test script:', err);
  });
