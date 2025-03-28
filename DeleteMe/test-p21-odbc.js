// Test script for P21 connection using ODBC DSN
const odbc = require('odbc');

async function testP21OdbcConnection() {
  console.log('Testing P21 connection using ODBC DSN...');
  
  try {
    // Create connection string for P21 using DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    
    console.log('Connecting to P21Play DSN...');
    
    // Create a new connection
    const connection = await odbc.connect(connectionString);
    
    console.log('Successfully connected to P21Play DSN');
    
    // Test a simple query
    console.log('Executing test query...');
    const result = await connection.query('SELECT @@VERSION as version');
    
    console.log('SQL Server version:');
    console.log(result[0].version);
    
    // Try to query a P21 table
    console.log('\nTesting P21 table access...');
    try {
      const p21Result = await connection.query('SELECT TOP 5 * FROM inv_mast');
      console.log('Successfully queried inv_mast table:');
      console.log(p21Result);
    } catch (tableError) {
      console.error('Error querying P21 table:', tableError.message);
    }
    
    // Close the connection
    await connection.close();
    console.log('Connection closed');
    
    return true;
  } catch (error) {
    console.error('P21 ODBC connection test failed:');
    console.error(error.message);
    return false;
  }
}

// Run the test
testP21OdbcConnection()
  .then(success => {
    if (success) {
      console.log('P21 ODBC connection test completed successfully');
    } else {
      console.log('P21 ODBC connection test failed');
    }
  })
  .catch(err => {
    console.error('Unhandled error in test script:', err);
  });
