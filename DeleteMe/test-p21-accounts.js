const odbc = require('odbc');

/**
 * Script to test the SQL queries for the Accounts group directly against P21
 */
async function testP21AccountsQueries() {
  console.log('=== Testing P21 Accounts SQL Queries ===');
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
    
    // Define test queries for Accounts
    const queries = [
      {
        name: "Simple Test Query",
        sql: "SELECT 1 as value"
      },
      {
        name: "Accounts Payable (Simple)",
        sql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ap_open_items WHERE status = 'O'"
      },
      {
        name: "Accounts Receivable (Simple)",
        sql: "SELECT COALESCE(SUM(balance), 0) as value FROM dbo.ar_open_items WHERE status = 'O'"
      }
    ];
    
    // Test each query
    console.log('\n--- Testing SQL queries ---');
    
    for (const query of queries) {
      console.log(`\nTesting: ${query.name}`);
      console.log(`SQL: ${query.sql}`);
      
      try {
        const result = await connection.query(query.sql);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully with result:', result[0].value);
        } else {
          console.log('⚠️ Query executed but returned no results');
        }
      } catch (error) {
        console.error('❌ Error executing query:', error.message);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== P21 Accounts SQL Queries Testing Completed ===');
}

// Run the test function
testP21AccountsQueries()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
