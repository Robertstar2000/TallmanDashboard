// Direct test script for P21 ODBC connection without requiring TypeScript compilation
const odbc = require('odbc');

// Test SQL queries
const P21_VERSION_QUERY = "SELECT @@VERSION as version";
const P21_TABLES_QUERY = "SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES";

async function testP21Connection() {
  console.log('\n=== Testing P21 Connection via ODBC DSN ===');
  console.log('Connecting to P21 database using ODBC DSN...');
  
  try {
    // Create connection string for P21 using DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    
    // Create a new connection
    const connection = await odbc.connect(connectionString);
    console.log('Successfully connected to P21 database');
    
    // Test a simple query
    console.log('Executing version query...');
    const versionResult = await connection.query(P21_VERSION_QUERY);
    console.log('SQL Server version:', versionResult[0].version.split('\n')[0]);
    
    // Try a more complex query if the version query succeeds
    console.log('\nExecuting tables query...');
    try {
      const tableResult = await connection.query(P21_TABLES_QUERY);
      console.log('Tables in P21 database:');
      tableResult.forEach((row, index) => {
        console.log(`${index + 1}. ${row.TABLE_NAME}`);
      });
    } catch (queryError) {
      console.error('Error executing table query:', queryError.message);
    }
    
    // Close the connection
    await connection.close();
    console.log('P21 connection closed');
    
    return true;
  } catch (error) {
    console.error('P21 connection test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run the test
testP21Connection().then(success => {
  console.log(`\nP21 connection test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error in test:', error);
  process.exit(1);
});
