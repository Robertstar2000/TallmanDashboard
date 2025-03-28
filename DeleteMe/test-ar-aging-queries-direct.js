// Script to test AR Aging queries directly
// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testARAgingQueries() {
  console.log('Testing AR Aging Queries...');
  
  // AR Aging queries from initial-data.ts
  const queries = [
    {
      name: 'Current',
      query: "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due = 0"
    },
    {
      name: '1-30 Days',
      query: "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 0 AND days_past_due <= 30"
    },
    {
      name: '31-60 Days',
      query: "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 30 AND days_past_due <= 60"
    },
    {
      name: '61-90 Days',
      query: "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 60 AND days_past_due <= 90"
    },
    {
      name: '90+ Days',
      query: "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 90"
    }
  ];

  // Execute each query and log the results
  for (const queryInfo of queries) {
    console.log(`\nExecuting query for ${queryInfo.name}...`);
    console.log(`Query: ${queryInfo.query}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/executeQuery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server: 'P21',
          query: queryInfo.query
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed for ${queryInfo.name}: ${errorText}`);
        continue;
      }
      
      const data = await response.json();
      console.log(`Response for ${queryInfo.name}:`, JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log(`Result value for ${queryInfo.name}: ${data.data[0]}`);
        console.log(`Result type: ${typeof data.data[0]}`);
      } else {
        console.error(`Query execution failed for ${queryInfo.name}: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error executing query for ${queryInfo.name}:`, error);
    }
  }
}

// Run the test
testARAgingQueries().catch(error => {
  console.error('Unhandled error in test script:', error);
});
