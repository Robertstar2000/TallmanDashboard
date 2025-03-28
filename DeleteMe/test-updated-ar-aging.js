const odbc = require('odbc');

/**
 * Script to test the updated AR Aging queries using the p21_view_asst_customer_aging view
 */
async function testUpdatedArAgingQueries() {
  console.log('=== Testing Updated AR Aging Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Test if the p21_view_asst_customer_aging view exists
    console.log('\n--- Checking if p21_view_asst_customer_aging view exists ---');
    const viewExistsQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME,
        TABLE_TYPE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_SCHEMA = 'dbo' AND
        TABLE_NAME = 'p21_view_asst_customer_aging'
    `;
    
    const viewExists = await connection.query(viewExistsQuery);
    
    if (viewExists.length > 0) {
      console.log(`✅ View exists: ${viewExists[0].TABLE_SCHEMA}.${viewExists[0].TABLE_NAME} (${viewExists[0].TABLE_TYPE})`);
      
      // Get column information
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'dbo' 
          AND TABLE_NAME = 'p21_view_asst_customer_aging'
        ORDER BY ORDINAL_POSITION
      `;
      
      const columns = await connection.query(columnsQuery);
      console.log('\n--- Columns in p21_view_asst_customer_aging ---');
      columns.forEach(col => {
        console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
      });
      
      // Get row count
      const countQuery = `
        SELECT COUNT(*) as row_count
        FROM dbo.p21_view_asst_customer_aging
      `;
      
      const countResult = await connection.query(countQuery);
      console.log(`\n✅ View has ${countResult[0].row_count} rows`);
      
      // Test each AR Aging query
      console.log('\n--- Testing AR Aging Queries ---');
      
      // Current
      const currentQuery = "SELECT COALESCE(SUM(current_due), 0) as value FROM dbo.p21_view_asst_customer_aging";
      const currentResult = await connection.query(currentQuery);
      console.log(`Current: $${currentResult[0].value.toFixed(2)}`);
      
      // 1-30 Days
      const days1To30Query = "SELECT COALESCE(SUM(past_due_1_30), 0) as value FROM dbo.p21_view_asst_customer_aging";
      const days1To30Result = await connection.query(days1To30Query);
      console.log(`1-30 Days: $${days1To30Result[0].value.toFixed(2)}`);
      
      // 31-60 Days
      const days31To60Query = "SELECT COALESCE(SUM(past_due_30_60), 0) as value FROM dbo.p21_view_asst_customer_aging";
      const days31To60Result = await connection.query(days31To60Query);
      console.log(`31-60 Days: $${days31To60Result[0].value.toFixed(2)}`);
      
      // 61-90 Days
      const days61To90Query = "SELECT COALESCE(SUM(past_due_60_90), 0) as value FROM dbo.p21_view_asst_customer_aging";
      const days61To90Result = await connection.query(days61To90Query);
      console.log(`61-90 Days: $${days61To90Result[0].value.toFixed(2)}`);
      
      // 90+ Days
      const days90PlusQuery = "SELECT COALESCE(SUM(past_due_over90), 0) as value FROM dbo.p21_view_asst_customer_aging";
      const days90PlusResult = await connection.query(days90PlusQuery);
      console.log(`90+ Days: $${days90PlusResult[0].value.toFixed(2)}`);
      
      // Total AR
      const totalArQuery = "SELECT COALESCE(SUM(total_due), 0) as value FROM dbo.p21_view_asst_customer_aging";
      const totalArResult = await connection.query(totalArQuery);
      console.log(`Total AR: $${totalArResult[0].value.toFixed(2)}`);
      
      // Verify that the sum of all buckets equals the total
      const sumOfBuckets = 
        currentResult[0].value + 
        days1To30Result[0].value + 
        days31To60Result[0].value + 
        days61To90Result[0].value + 
        days90PlusResult[0].value;
      
      console.log(`\nSum of all buckets: $${sumOfBuckets.toFixed(2)}`);
      console.log(`Matches total AR: ${Math.abs(sumOfBuckets - totalArResult[0].value) < 0.01 ? '✅ Yes' : '❌ No'}`);
      
      // Get a sample of data
      const sampleQuery = `
        SELECT TOP 5 *
        FROM dbo.p21_view_asst_customer_aging
      `;
      
      const sampleData = await connection.query(sampleQuery);
      console.log('\n--- Sample Data (first row) ---');
      console.log(JSON.stringify(sampleData[0], null, 2));
      
    } else {
      console.log('❌ View does not exist: dbo.p21_view_asst_customer_aging');
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Queries Test Completed ===');
}

// Run the test
testUpdatedArAgingQueries()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
