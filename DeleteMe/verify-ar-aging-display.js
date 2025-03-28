// Import node-fetch correctly
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script to verify that the AR Aging data is displaying correctly in the dashboard
 */
async function verifyArAgingDisplay() {
  console.log('=== Verifying AR Aging Display ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Fetch the dashboard data from the API
    console.log('\n--- Fetching dashboard data from API ---');
    const response = await fetch('http://localhost:3000/api/dashboard/data?t=' + new Date().getTime());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }
    
    const dashboardData = await response.json();
    
    // Check if the AR Aging data is present
    console.log('\n--- Checking AR Aging data ---');
    
    if (!dashboardData.arAging || !Array.isArray(dashboardData.arAging)) {
      throw new Error('AR Aging data is missing or not an array');
    }
    
    console.log(`Found ${dashboardData.arAging.length} AR Aging data points`);
    
    // Log the AR Aging data
    console.log('\nAR Aging data from dashboard API:');
    dashboardData.arAging.forEach(item => {
      console.log(`- ${item.range}: ${item.amount}`);
    });
    
    // Verify that the values are correct
    console.log('\n--- Verifying AR Aging values ---');
    
    // Expected values based on our fix script
    const expectedValues = {
      'Current': 0,
      '1-30 Days': 0,
      '31-60 Days': 0,
      '61-90 Days': 1168,
      '90+ Days': 9568728
    };
    
    // Check each value
    let allValuesCorrect = true;
    
    dashboardData.arAging.forEach(item => {
      const range = item.range;
      const amount = typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount).replace(/[^0-9.-]+/g, ''));
      const expectedAmount = expectedValues[range];
      
      if (expectedAmount === undefined) {
        console.log(`⚠️ No expected value for range "${range}"`);
        return;
      }
      
      // Allow for some rounding differences
      const isCorrect = Math.abs(amount - expectedAmount) < 1;
      
      console.log(`${range}: ${amount} (expected: ${expectedAmount}) - ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      
      if (!isCorrect) {
        allValuesCorrect = false;
      }
    });
    
    // Final result
    if (allValuesCorrect) {
      console.log('\n✅ All AR Aging values are displaying correctly in the dashboard!');
    } else {
      console.log('\n❌ Some AR Aging values are not displaying correctly in the dashboard.');
    }
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Display Verification Completed ===');
}

// Run the verification function
verifyArAgingDisplay()
  .then(() => {
    console.log('Verification completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
