// Test script to diagnose P21 query execution issues
const { ConnectionManager } = require('../lib/db/connection-manager');

async function testP21Connection() {
  try {
    console.log('Testing P21 connection...');
    
    const config = {
      type: 'P21'
    };
    
    const result = await ConnectionManager.testP21Connection(config);
    console.log('Connection test result:', result);
    
    return result.success;
  } catch (error) {
    console.error('Error testing P21 connection:', error);
    return false;
  }
}

async function executeP21Query(query) {
  try {
    console.log(`Executing P21 query: ${query}`);
    
    // Get the connection directly from the ConnectionManager
    const config = {
      type: 'P21'
    };
    
    // Get a connection to the P21 database
    const connection = await ConnectionManager.getConnection(config);
    
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
    const connectionSuccess = await testP21Connection();
    if (!connectionSuccess) {
      console.error('P21 connection test failed. Cannot proceed with query tests.');
      return;
    }
    
    console.log('\n--- Testing simple version query ---');
    await executeP21Query('SELECT @@VERSION as version');
    
    // Test a simple COUNT query
    console.log('\n--- Testing simple COUNT query ---');
    await executeP21Query('SELECT COUNT(*) as count FROM sysobjects');
    
    // Test a query that should return a non-zero value
    console.log('\n--- Testing query that should return non-zero value ---');
    await executeP21Query('SELECT COUNT(*) as count FROM sys.tables');
    
    // Test with schema qualification
    console.log('\n--- Testing with schema qualification ---');
    await executeP21Query('SELECT TOP 1 * FROM sys.tables');
    
    // Test with a more specific P21 table if available
    console.log('\n--- Testing with P21 specific table ---');
    await executeP21Query('SELECT TOP 1 * FROM dbo.sysobjects');
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Error during tests:', error);
  }
}

// Run the tests
testQueries().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
