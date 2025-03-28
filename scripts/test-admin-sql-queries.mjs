// Script to test specific SQL queries for the admin spreadsheet
import odbc from 'odbc';

async function testAdminQueries() {
  let connection;
  try {
    console.log('Connecting to P21Play database...');
    connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Switch to P21Play database
    await connection.query('USE P21Play');
    
    // Verify current database
    const currentDbResult = await connection.query('SELECT DB_NAME() as database_name');
    console.log(`Current database: ${currentDbResult[0].database_name}`);
    
    // Define test queries for admin spreadsheet
    const testQueries = [
      {
        name: 'Total Orders',
        query: 'SELECT COUNT(*) as count FROM dbo.oe_hdr'
      },
      {
        name: 'Average Order Amount',
        query: 'SELECT AVG(order_tot) as avg_amount FROM dbo.oe_hdr'
      },
      {
        name: 'Inventory Item Count',
        query: 'SELECT COUNT(*) as count FROM dbo.inv_mast'
      },
      {
        name: 'Customer Count',
        query: 'SELECT COUNT(*) as count FROM dbo.customer'
      },
      {
        name: 'Invoice Line Count',
        query: 'SELECT COUNT(*) as count FROM dbo.invoice_line'
      },
      {
        name: 'Average Invoice Line Amount',
        query: 'SELECT AVG(unit_price) as avg_price FROM dbo.invoice_line'
      }
    ];
    
    // Test each query
    console.log('\n--- Testing Admin Spreadsheet Queries ---');
    for (const test of testQueries) {
      console.log(`\nTesting: ${test.name}`);
      console.log(`Query: ${test.query}`);
      
      try {
        const result = await connection.query(test.query);
        const value = Object.values(result[0])[0];
        console.log(`Result: ${value}`);
        
        // If the query succeeds, this is a valid query for the admin spreadsheet
        console.log(`✅ Query is valid and returns: ${value}`);
      } catch (error) {
        console.log(`❌ Error executing query: ${error.message}`);
      }
    }
    
    console.log('\n--- Testing with Schema Qualification ---');
    // Test with explicit schema qualification
    const schemaQualifiedQueries = [
      {
        name: 'Total Orders with Schema',
        query: 'SELECT COUNT(*) as count FROM P21Play.dbo.oe_hdr'
      },
      {
        name: 'Average Order Amount with Schema',
        query: 'SELECT AVG(order_tot) as avg_amount FROM P21Play.dbo.oe_hdr'
      }
    ];
    
    for (const test of schemaQualifiedQueries) {
      console.log(`\nTesting: ${test.name}`);
      console.log(`Query: ${test.query}`);
      
      try {
        const result = await connection.query(test.query);
        const value = Object.values(result[0])[0];
        console.log(`Result: ${value}`);
        
        // If the query succeeds, this is a valid query for the admin spreadsheet
        console.log(`✅ Query is valid and returns: ${value}`);
      } catch (error) {
        console.log(`❌ Error executing query: ${error.message}`);
      }
    }
    
    // Test with NOLOCK hint
    console.log('\n--- Testing with NOLOCK Hint ---');
    const nolockQueries = [
      {
        name: 'Total Orders with NOLOCK',
        query: 'SELECT COUNT(*) as count FROM dbo.oe_hdr WITH (NOLOCK)'
      },
      {
        name: 'Average Order Amount with NOLOCK',
        query: 'SELECT AVG(order_tot) as avg_amount FROM dbo.oe_hdr WITH (NOLOCK)'
      }
    ];
    
    for (const test of nolockQueries) {
      console.log(`\nTesting: ${test.name}`);
      console.log(`Query: ${test.query}`);
      
      try {
        const result = await connection.query(test.query);
        const value = Object.values(result[0])[0];
        console.log(`Result: ${value}`);
        
        // If the query succeeds, this is a valid query for the admin spreadsheet
        console.log(`✅ Query is valid and returns: ${value}`);
      } catch (error) {
        console.log(`❌ Error executing query: ${error.message}`);
      }
    }
    
    console.log('\nAll tests completed');
  } catch (error) {
    console.error('Error testing admin queries:', error);
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
testAdminQueries().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
