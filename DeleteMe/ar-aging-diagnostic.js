// AR Aging Diagnostic Tool
// This script tests the entire data flow for AR Aging from SQL queries to final display

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function runARAgingDiagnostic() {
  console.log('AR Aging Diagnostic Tool');
  console.log('========================\n');
  
  // Step 1: Test the direct SQL queries
  console.log('STEP 1: Testing Direct SQL Queries');
  console.log('----------------------------------');
  
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

  // Test direct SQL queries
  const directQueryResults = {};
  
  try {
    for (const queryInfo of queries) {
      console.log(`\nTesting query for ${queryInfo.name}...`);
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
          console.error(`API request failed for ${queryInfo.name}: ${response.status} ${response.statusText}`);
          console.error(`Error details: ${errorText}`);
          directQueryResults[queryInfo.name] = { error: errorText };
          continue;
        }
        
        const data = await response.json();
        console.log(`Response for ${queryInfo.name}:`, JSON.stringify(data, null, 2));
        
        if (data.success) {
          const resultValue = typeof data.data === 'number' ? data.data : data.data[0]?.value;
          console.log(`Result value for ${queryInfo.name}: ${resultValue} (type: ${typeof resultValue})`);
          directQueryResults[queryInfo.name] = { value: resultValue };
        } else {
          console.error(`Query execution failed for ${queryInfo.name}: ${data.message || 'Unknown error'}`);
          directQueryResults[queryInfo.name] = { error: data.message || 'Unknown error' };
        }
      } catch (error) {
        console.error(`Error executing query for ${queryInfo.name}:`, error);
        directQueryResults[queryInfo.name] = { error: error.message };
      }
    }
    
    console.log('\nDirect SQL Query Results Summary:');
    console.log(JSON.stringify(directQueryResults, null, 2));
  } catch (error) {
    console.error('Error in Step 1:', error);
  }
  
  // Step 2: Test the dashboard API
  console.log('\n\nSTEP 2: Testing Dashboard API');
  console.log('--------------------------');
  
  try {
    console.log('Fetching dashboard data from API...');
    
    const response = await fetch('http://localhost:3000/api/dashboard/data');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Dashboard API request failed: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const dashboardData = await response.json();
    
    // Check if AR Aging data exists
    if (!dashboardData.arAging) {
      console.error('Dashboard API response does not contain AR Aging data');
      return;
    }
    
    console.log('AR Aging data from Dashboard API:');
    console.log(JSON.stringify(dashboardData.arAging, null, 2));
    
    // Validate AR Aging data structure
    console.log('\nValidating AR Aging data structure:');
    
    if (!Array.isArray(dashboardData.arAging)) {
      console.error('AR Aging data is not an array');
      return;
    }
    
    if (dashboardData.arAging.length !== 5) {
      console.warn(`Expected 5 AR Aging data points, but found ${dashboardData.arAging.length}`);
    }
    
    // Check each data point
    dashboardData.arAging.forEach((item, index) => {
      console.log(`\nChecking AR Aging data point ${index + 1}:`);
      
      // Check required properties
      if (!item.hasOwnProperty('id')) {
        console.error(`Missing 'id' property in data point ${index + 1}`);
      }
      
      if (!item.hasOwnProperty('range')) {
        console.error(`Missing 'range' property in data point ${index + 1}`);
      }
      
      if (!item.hasOwnProperty('amount')) {
        console.error(`Missing 'amount' property in data point ${index + 1}`);
      }
      
      // Check value types
      if (typeof item.amount !== 'number') {
        console.error(`'amount' property is not a number in data point ${index + 1}: ${typeof item.amount}`);
      }
      
      // Check for NaN or Infinity
      if (isNaN(item.amount) || !isFinite(item.amount)) {
        console.error(`'amount' property is NaN or Infinity in data point ${index + 1}: ${item.amount}`);
      }
      
      console.log(`Data point ${index + 1} is valid: ${item.range} = ${item.amount}`);
    });
  } catch (error) {
    console.error('Error in Step 2:', error);
  }
  
  console.log('\n\nDiagnostic completed!');
}

// Run the diagnostic
runARAgingDiagnostic().catch(error => {
  console.error('Unhandled error in diagnostic script:', error);
});
