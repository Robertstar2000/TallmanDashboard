// Test script to diagnose P21 query execution issues
import odbc from 'odbc';

async function testP21Connection() {
  try {
    console.log('Testing P21 connection...');
    
    // Use ODBC DSN connection directly
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    
    console.log('Connecting to P21 using DSN:', connectionString);
    const connection = await odbc.connect(connectionString);
    
    console.log('Connection established successfully');
    
    // Test connection with a simple query
    const versionResult = await connection.query('SELECT @@VERSION as version');
    const version = versionResult[0].version.split('\n')[0];
    
    console.log('SQL Server version:', version);
    
    return { connection, success: true };
  } catch (error) {
    console.error('Error testing P21 connection:', error);
    return { success: false };
  }
}

async function executeP21Query(connection, query) {
  try {
    console.log(`Executing P21 query: ${query}`);
    
    // Execute the query
    console.log('Executing query with connection...');
    const result = await connection.query(query);
    
    console.log('Query result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error executing P21 query:', error);
    throw error;
  }
}

async function testQueries() {
  try {
    // First test the connection
    const { connection, success } = await testP21Connection();
    if (!success) {
      console.error('P21 connection test failed. Cannot proceed with query tests.');
      return;
    }
    
    // Test a simple COUNT query
    console.log('\n--- Testing simple COUNT query ---');
    await executeP21Query(connection, 'SELECT COUNT(*) as count FROM sysobjects');
    
    // Test a query that should return a non-zero value
    console.log('\n--- Testing query that should return non-zero value ---');
    await executeP21Query(connection, 'SELECT COUNT(*) as count FROM sys.tables');
    
    // Test with schema qualification
    console.log('\n--- Testing with schema qualification ---');
    await executeP21Query(connection, 'SELECT TOP 1 * FROM sys.tables');
    
    // Test with a more specific P21 table if available
    console.log('\n--- Testing with P21 specific table ---');
    await executeP21Query(connection, 'SELECT TOP 1 * FROM dbo.sysobjects');
    
    // Try to find some common P21 tables
    console.log('\n--- Looking for P21 tables ---');
    const tablesResult = await executeP21Query(connection, "SELECT TOP 10 name FROM sys.tables WHERE name LIKE 'inv%' OR name LIKE 'po%' OR name LIKE 'order%'");
    
    // If we found some tables, try to query one of them
    if (tablesResult && tablesResult.length > 0) {
      const tableName = tablesResult[0].name;
      console.log(`\n--- Testing query against P21 table: ${tableName} ---`);
      await executeP21Query(connection, `SELECT COUNT(*) as count FROM ${tableName}`);
    }
    
    console.log('\nAll tests completed successfully');
    
    // Close the connection
    if (connection) {
      await connection.close();
      console.log('Connection closed');
    }
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
testQueries().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
