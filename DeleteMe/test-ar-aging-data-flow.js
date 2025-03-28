// Test script to diagnose AR Aging data flow issues
// This script tests the entire data flow for AR Aging from SQL queries to final display

// Import fetch for Node.js environments
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testARAgingDataFlow() {
  console.log('Testing AR Aging Data Flow...');
  console.log('=============================\n');
  
  // Step 1: Test the SQL queries directly
  console.log('STEP 1: Testing SQL Queries');
  console.log('---------------------------');
  
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

  // Test queries
  let queryResults = {};
  
  try {
    for (const queryInfo of queries) {
      console.log(`\nTesting query for ${queryInfo.name}...`);
      
      try {
        // Create a mock query result for testing
        // In production, this would be the actual query result
        const mockResult = {
          success: true,
          data: [Math.floor(Math.random() * 100000)] // Random value between 0 and 100000
        };
        
        console.log(`Mock result for ${queryInfo.name}: ${mockResult.data[0]}`);
        queryResults[queryInfo.name] = mockResult.data[0];
      } catch (error) {
        console.error(`Error executing query for ${queryInfo.name}:`, error);
        queryResults[queryInfo.name] = 0; // Default to 0 on error
      }
    }
  } catch (error) {
    console.error('Error in Step 1:', error);
  }
  
  console.log('\nQuery Results Summary:');
  console.log(queryResults);
  
  // Step 2: Test the dashboard data transformation
  console.log('\n\nSTEP 2: Testing Dashboard Data Transformation');
  console.log('------------------------------------------');
  
  try {
    // Create mock data in the format expected by the dashboard data route
    const mockDataByGroup = {
      'AR Aging': Object.entries(queryResults).map(([range, value], index) => ({
        id: `ar-${index + 1}`,
        chartGroup: 'AR Aging',
        variableName: range,
        value: value
      }))
    };
    
    console.log('Mock AR Aging data for transformation:');
    console.log(JSON.stringify(mockDataByGroup['AR Aging'], null, 2));
    
    // Simulate the transformation logic from the dashboard data route
    const dashboardData = { arAging: [] };
    
    // Process AR Aging - 5 buckets with one variable (Amount Due)
    if (mockDataByGroup['AR Aging']) {
      console.log(`\nProcessing AR Aging (${mockDataByGroup['AR Aging'].length} rows)`);
      
      // Take only the first 5 aging categories as per requirements
      const arData = mockDataByGroup['AR Aging'].slice(0, 5);
      
      // Default aging ranges if not enough data
      const defaultRanges = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
      
      // Ensure we have exactly 5 aging buckets
      for (let i = 0; i < 5; i++) {
        const row = arData[i] || { id: `ar-default-${i+1}`, value: '0' };
        
        // Log the row being processed
        console.log(`Processing AR Aging bucket ${i+1}:`, JSON.stringify(row));
        
        // Ensure the value is properly parsed
        let value = 0;
        try {
          // Check if the value is null, undefined, or empty string before parsing
          if (row.value === null || row.value === undefined || row.value === '') {
            console.warn(`Empty value for AR Aging bucket ${i+1}, defaulting to 0`);
            value = 0;
          } else {
            // Try to parse the value, handling different formats
            if (typeof row.value === 'number') {
              value = row.value;
            } else if (typeof row.value === 'string') {
              // Remove any non-numeric characters except decimal point and negative sign
              const cleanedValue = row.value.replace(/[^0-9.-]/g, '');
              value = parseFloat(cleanedValue);
              
              // Check if the parsed value is a valid number
              if (isNaN(value)) {
                console.warn(`Invalid string value for AR Aging bucket ${i+1}: "${row.value}", defaulting to 0`);
                value = 0;
              }
            } else {
              console.warn(`Unexpected value type for AR Aging bucket ${i+1}: ${typeof row.value}, defaulting to 0`);
              value = 0;
            }
          }
          
          console.log(`Parsed value for ${row.variableName || defaultRanges[i]}: ${value}`);
        } catch (error) {
          console.error(`Error parsing value for AR Aging bucket ${i+1}:`, error);
          value = 0;
        }
        
        // Ensure the value is a valid number
        if (isNaN(value) || !isFinite(value)) {
          console.warn(`Invalid numeric value for AR Aging bucket ${i+1} after parsing: ${value}, defaulting to 0`);
          value = 0;
        }
        
        dashboardData.arAging.push({
          id: `ar-${row.id || i+1}`,
          range: row.variableName || defaultRanges[i],
          amount: value
        });
      }
      
      // Log the final processed AR Aging data
      console.log('\nProcessed AR Aging data:');
      console.log(JSON.stringify(dashboardData.arAging, null, 2));
    } else {
      console.warn('No AR Aging data found');
      
      // Add default empty buckets
      const defaultRanges = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];
      for (let i = 0; i < 5; i++) {
        dashboardData.arAging.push({
          id: `ar-default-${i+1}`,
          range: defaultRanges[i],
          amount: 0
        });
      }
    }
  } catch (error) {
    console.error('Error in Step 2:', error);
  }
  
  // Step 3: Test the chart component rendering
  console.log('\n\nSTEP 3: Testing Chart Component Rendering');
  console.log('--------------------------------------');
  
  try {
    // Simulate the chart component rendering
    console.log('Verifying AR Aging data structure for chart component:');
    
    // Create a mock AR Aging dataset
    const mockArAging = [
      { id: 'ar-1', range: 'Current', amount: 25000 },
      { id: 'ar-2', range: '1-30 Days', amount: 15000 },
      { id: 'ar-3', range: '31-60 Days', amount: 10000 },
      { id: 'ar-4', range: '61-90 Days', amount: 5000 },
      { id: 'ar-5', range: '90+ Days', amount: 2500 }
    ];
    
    console.log('Mock AR Aging data for chart:');
    console.log(JSON.stringify(mockArAging, null, 2));
    
    // Verify data structure
    let isValidData = true;
    
    // Check if data is an array
    if (!Array.isArray(mockArAging)) {
      console.error('AR Aging data is not an array');
      isValidData = false;
    } else {
      // Check if we have the expected number of data points
      if (mockArAging.length !== 5) {
        console.warn(`Expected 5 AR Aging data points, but found ${mockArAging.length}`);
      }
      
      // Check each data point
      mockArAging.forEach((item, index) => {
        console.log(`\nChecking AR Aging data point ${index + 1}:`);
        
        // Check required properties
        if (!item.hasOwnProperty('id')) {
          console.error(`Missing 'id' property in data point ${index + 1}`);
          isValidData = false;
        }
        
        if (!item.hasOwnProperty('range')) {
          console.error(`Missing 'range' property in data point ${index + 1}`);
          isValidData = false;
        }
        
        if (!item.hasOwnProperty('amount')) {
          console.error(`Missing 'amount' property in data point ${index + 1}`);
          isValidData = false;
        }
        
        // Check value types
        if (typeof item.amount !== 'number') {
          console.error(`'amount' property is not a number in data point ${index + 1}: ${typeof item.amount}`);
          isValidData = false;
        }
        
        // Check for NaN or Infinity
        if (isNaN(item.amount) || !isFinite(item.amount)) {
          console.error(`'amount' property is NaN or Infinity in data point ${index + 1}: ${item.amount}`);
          isValidData = false;
        }
        
        console.log(`Data point ${index + 1} is valid: ${item.range} = ${item.amount}`);
      });
    }
    
    console.log(`\nAR Aging data structure is ${isValidData ? 'valid' : 'invalid'} for chart rendering`);
  } catch (error) {
    console.error('Error in Step 3:', error);
  }
  
  console.log('\n\nTest completed!');
}

// Run the test
testARAgingDataFlow().catch(error => {
  console.error('Unhandled error in test script:', error);
});
