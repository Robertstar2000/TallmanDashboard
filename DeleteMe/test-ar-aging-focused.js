const odbc = require('odbc');

/**
 * Script to test the AR Aging queries from the dashboard with improved output
 */
async function testArAgingQueries() {
  console.log('=== P21 AR Aging Query Tester (Focused) ===');
  console.log('Starting at', new Date().toISOString());
  
  // The AR Aging queries from initial-data.ts
  const arAgingQueries = [
    {
      bucket: 'Current',
      query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due = 0"
    },
    {
      bucket: '1-30 Days',
      query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 0 AND number_days_past_due <= 30"
    },
    {
      bucket: '31-60 Days',
      query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 30 AND number_days_past_due <= 60"
    },
    {
      bucket: '61-90 Days',
      query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 60 AND number_days_past_due <= 90"
    },
    {
      bucket: '90+ Days',
      query: "SELECT ISNULL(SUM(ar_balance), 0) as value FROM dbo.metrics_period_hierarchy WITH (NOLOCK) WHERE number_days_past_due > 90"
    }
  ];
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // First, check if metrics_period_hierarchy table exists and get a sample row
    console.log('\n--- Checking metrics_period_hierarchy table sample data ---');
    try {
      const sampleQuery = `
        SELECT TOP 5 * 
        FROM dbo.metrics_period_hierarchy WITH (NOLOCK)
        ORDER BY number_days_past_due
      `;
      
      const sampleData = await connection.query(sampleQuery);
      if (sampleData.length > 0) {
        console.log(`✅ Found ${sampleData.length} sample rows in metrics_period_hierarchy`);
        console.log('Sample row:');
        console.log(JSON.stringify(sampleData[0], null, 2));
      } else {
        console.log('⚠️ Table exists but contains no data');
      }
    } catch (error) {
      console.error(`❌ Error getting sample data: ${error.message}`);
    }
    
    // Now test each AR Aging query
    console.log('\n--- Testing AR Aging Queries ---');
    for (const queryInfo of arAgingQueries) {
      console.log(`\nTesting query for ${queryInfo.bucket}:`);
      console.log(queryInfo.query);
      
      try {
        const result = await connection.query(queryInfo.query);
        console.log(`✅ Query successful!`);
        console.log(`Result:`, JSON.stringify(result[0], null, 2));
        
        // Check if the value is 0, which might indicate an issue
        if (result[0] && result[0].value === 0) {
          console.log('⚠️ Query returned zero. This might be correct or might indicate an issue.');
          
          // Try a count query to see if there are any rows that should match
          const countQuery = queryInfo.query.replace(/ISNULL\(SUM\(ar_balance\), 0\)/i, 'COUNT(*)');
          console.log(`Running count query to check: ${countQuery}`);
          
          try {
            const countResult = await connection.query(countQuery);
            console.log(`Count result: ${JSON.stringify(countResult[0], null, 2)}`);
            
            if (countResult[0] && countResult[0].value > 0) {
              console.log(`⚠️ Found ${countResult[0].value} rows that match the criteria, but sum is 0. Check if ar_balance values are correct.`);
            } else {
              console.log('✅ No matching rows found, so sum of 0 is correct.');
            }
          } catch (countError) {
            console.error(`❌ Error running count query: ${countError.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Query failed: ${error.message}`);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Query Tests Completed ===');
}

// Run the tests
testArAgingQueries()
  .then(() => {
    console.log('Tests completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
