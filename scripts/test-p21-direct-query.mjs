// Script to directly test P21 queries without relying on the admin API
import odbc from 'odbc';

async function testP21Queries() {
  let connection;
  try {
    console.log('Connecting to P21Play database...');
    connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Switch to P21Play database
    await connection.query('USE P21Play');
    
    // Define test queries
    const testQueries = [
      {
        name: 'Total Orders',
        originalQuery: 'SELECT COUNT(*) FROM oe_hdr',
        modifiedQuery: 'SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK)'
      },
      {
        name: 'Inventory Items',
        originalQuery: 'SELECT COUNT(*) FROM inv_mast',
        modifiedQuery: 'SELECT COUNT(*) FROM dbo.inv_mast WITH (NOLOCK)'
      },
      {
        name: 'Customer Count',
        originalQuery: 'SELECT COUNT(*) FROM customer',
        modifiedQuery: 'SELECT COUNT(*) FROM dbo.customer WITH (NOLOCK)'
      },
      {
        name: 'Invoice Line Count',
        originalQuery: 'SELECT COUNT(*) FROM invoice_line',
        modifiedQuery: 'SELECT COUNT(*) FROM dbo.invoice_line WITH (NOLOCK)'
      }
    ];
    
    // Test each query
    for (const test of testQueries) {
      console.log(`\n--- Testing: ${test.name} ---`);
      
      // Test original query
      console.log(`Original query: ${test.originalQuery}`);
      try {
        const originalResult = await connection.query(test.originalQuery);
        const originalValue = Object.values(originalResult[0])[0];
        console.log(`✅ Original query succeeded with result: ${originalValue}`);
      } catch (originalError) {
        console.log(`❌ Original query failed: ${originalError.message}`);
      }
      
      // Test modified query
      console.log(`Modified query: ${test.modifiedQuery}`);
      try {
        const modifiedResult = await connection.query(test.modifiedQuery);
        const modifiedValue = Object.values(modifiedResult[0])[0];
        console.log(`✅ Modified query succeeded with result: ${modifiedValue}`);
      } catch (modifiedError) {
        console.log(`❌ Modified query failed: ${modifiedError.message}`);
      }
    }
    
    console.log('\nAll tests completed');
  } catch (error) {
    console.error('Error testing P21 queries:', error);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed');
      } catch (closeError) {
        console.error('Error closing connection:', closeError);
      }
    }
  }
}

// Run the tests
testP21Queries().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
