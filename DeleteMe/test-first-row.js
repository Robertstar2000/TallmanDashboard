/**
 * Test script to verify the first row query execution
 * This script tests the exact query used for the first row in the dashboard
 */

const odbc = require('odbc');

async function testFirstRowQuery() {
  console.log('=== First Row Query Test ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect to P21 database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Test the query with and without schema prefix
    const queries = [
      {
        name: '1. Total Orders (Last 7 Days) - No Schema',
        sql: `SELECT COUNT(*) as value 
              FROM oe_hdr WITH (NOLOCK) 
              WHERE order_date >= DATEADD(day, -7, GETDATE())`
      },
      {
        name: '2. Total Orders (Last 7 Days) - With Schema',
        sql: `SELECT COUNT(*) as value 
              FROM dbo.oe_hdr WITH (NOLOCK) 
              WHERE order_date >= DATEADD(day, -7, GETDATE())`
      },
      {
        name: '3. Total Orders (All Time)',
        sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)`
      }
    ];
    
    // Execute each query and log results
    for (const query of queries) {
      console.log(`\n--- Testing: ${query.name} ---`);
      console.log(`SQL: ${query.sql}`);
      
      try {
        console.log('Executing query directly...');
        const result = await connection.query(query.sql);
        
        if (Array.isArray(result) && result.length > 0) {
          console.log(`✅ Direct query result: ${JSON.stringify(result[0])}`);
          
          if ('value' in result[0]) {
            console.log(`Value: ${result[0].value}`);
          } else {
            const firstKey = Object.keys(result[0])[0];
            console.log(`First column (${firstKey}): ${result[0][firstKey]}`);
          }
        } else {
          console.log(`❌ No results or unexpected format: ${JSON.stringify(result)}`);
        }
        
        // Now simulate how the connection manager processes this result
        console.log('Simulating connection manager processing...');
        let processedValue;
        
        if (Array.isArray(result) && result.length > 0) {
          const firstRow = result[0];
          
          if ('value' in firstRow) {
            processedValue = firstRow.value;
            console.log(`Processed 'value' property: ${processedValue}`);
          } else {
            const firstColumnName = Object.keys(firstRow)[0];
            processedValue = firstRow[firstColumnName];
            console.log(`Processed first column '${firstColumnName}': ${processedValue}`);
          }
        } else {
          processedValue = 0;
          console.log(`No results, default value: ${processedValue}`);
        }
        
        console.log(`Final processed value: ${processedValue}`);
      } catch (error) {
        console.error(`❌ Error executing query: ${error.message}`);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  console.log('\n=== Test completed at', new Date().toISOString(), '===');
}

// Run the test
testFirstRowQuery().catch(error => {
  console.error('Error running test:', error);
});
