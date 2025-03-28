/**
 * Single Query Test for P21 Database
 * This script tests a single query against the P21 database to diagnose connection issues
 */

const odbc = require('odbc');

// The query to test
const testQuery = "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'";

async function testSingleQuery() {
  console.log('=== Single P21 Query Test ===');
  console.log('Starting test at', new Date().toISOString());
  console.log(`Query to test: ${testQuery}`);
  
  try {
    // Get DSN and credentials from environment variables or use defaults
    const dsn = process.env.P21_DSN || 'P21Play';
    
    // Build connection string with Windows Authentication
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    try {
      // Test server and database information
      console.log('\n--- Server Information ---');
      const serverInfoResult = await connection.query("SELECT @@SERVERNAME AS server_name, DB_NAME() AS database_name");
      if (serverInfoResult && serverInfoResult.length > 0) {
        console.log(`Server: ${serverInfoResult[0].server_name}`);
        console.log(`Database: ${serverInfoResult[0].database_name}`);
      } else {
        console.log('❌ Failed to get server information');
      }
      
      // Execute the test query
      console.log('\n--- Test Query Execution ---');
      console.log(`Executing query: ${testQuery}`);
      const startTime = Date.now();
      const result = await connection.query(testQuery);
      const duration = Date.now() - startTime;
      console.log(`Query executed in ${duration}ms`);
      
      // Process the result
      if (result && result.length > 0) {
        console.log('✅ Query returned results');
        console.log('First row:', JSON.stringify(result[0]));
        
        // Try to find a 'value' column
        const firstRow = result[0];
        const valueKey = Object.keys(firstRow).find(key => key.toLowerCase() === 'value');
        
        if (valueKey) {
          const value = firstRow[valueKey];
          console.log(`Value: ${value} (type: ${typeof value})`);
          
          if (value === 0 || value === '0') {
            console.log('⚠️ WARNING: Query returned zero value!');
          } else {
            console.log('✅ SUCCESS: Query returned non-zero value!');
          }
        } else {
          console.log('❌ No "value" column found in result');
          console.log('Available columns:', Object.keys(firstRow).join(', '));
        }
      } else {
        console.log('❌ Query returned no results');
      }
    } finally {
      // Close the connection
      await connection.close();
      console.log('\n--- Connection closed ---');
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testSingleQuery().catch(error => {
  console.error('Unhandled error:', error);
});
