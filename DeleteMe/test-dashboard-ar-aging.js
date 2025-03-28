const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script to test the AR Aging data through the dashboard API
 */
async function testDashboardArAging() {
  console.log('=== Testing Dashboard AR Aging Data ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Define the AR Aging queries to test
    const arAgingQueries = [
      {
        variableName: 'Current',
        sqlExpression: "SELECT COALESCE(SUM(current_due), 0) as value FROM dbo.p21_view_asst_customer_aging"
      },
      {
        variableName: '1-30 Days',
        sqlExpression: "SELECT COALESCE(SUM(past_due_1_30), 0) as value FROM dbo.p21_view_asst_customer_aging"
      },
      {
        variableName: '31-60 Days',
        sqlExpression: "SELECT COALESCE(SUM(past_due_30_60), 0) as value FROM dbo.p21_view_asst_customer_aging"
      },
      {
        variableName: '61-90 Days',
        sqlExpression: "SELECT COALESCE(SUM(past_due_60_90), 0) as value FROM dbo.p21_view_asst_customer_aging"
      },
      {
        variableName: '90+ Days',
        sqlExpression: "SELECT COALESCE(SUM(past_due_over90), 0) as value FROM dbo.p21_view_asst_customer_aging"
      }
    ];
    
    console.log('\n--- Testing AR Aging Queries through API ---');
    
    // Test each query through the dashboard API
    for (const query of arAgingQueries) {
      console.log(`\nTesting ${query.variableName}...`);
      
      const response = await fetch('http://localhost:3000/api/executeQuery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.sqlExpression,
          server: 'P21'
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          console.log(`${query.variableName}: $${parseFloat(data.data[0].value).toFixed(2)}`);
        } else {
          console.log(`${query.variableName}: No results or error in response`);
          console.log('Response:', JSON.stringify(data, null, 2));
        }
      } else {
        console.error(`Error executing query for ${query.variableName}:`, await response.text());
      }
    }
    
    console.log('\n=== AR Aging Dashboard Test Completed ===');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the test
testDashboardArAging()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
