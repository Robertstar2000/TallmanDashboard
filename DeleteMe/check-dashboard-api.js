const http = require('http');

/**
 * Script to check the dashboard API and verify that it's returning the correct AR Aging data
 */
async function checkDashboardApi() {
  console.log('=== Checking Dashboard API ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Add a cache-busting parameter to force a fresh fetch
    const url = `http://localhost:3000/api/dashboard/data?t=${Date.now()}`;
    console.log(`Fetching dashboard data from: ${url}`);
    
    // Use the http module to make the request
    const data = await new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let data = '';
        
        // A chunk of data has been received
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        // The whole response has been received
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP error! Status: ${res.statusCode}`));
            return;
          }
          
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Error parsing JSON: ${error.message}`));
          }
        });
      }).on('error', (error) => {
        reject(new Error(`Error making HTTP request: ${error.message}`));
      });
    });
    
    // Check if the response has AR Aging data
    if (!data.arAging || !Array.isArray(data.arAging) || data.arAging.length === 0) {
      console.log('❌ No AR Aging data found in the API response');
      return;
    }
    
    console.log(`\nFound ${data.arAging.length} AR Aging data points in the API response:`);
    
    // Log the AR Aging data
    data.arAging.forEach((item, index) => {
      console.log(`${index + 1}. ${item.range}: $${item.amount.toLocaleString()}`);
    });
    
    // Expected values
    const expectedValues = [
      { range: 'Current', amount: 0 },
      { range: '1-30 Days', amount: 0 },
      { range: '31-60 Days', amount: 0 },
      { range: '61-90 Days', amount: 1168 },
      { range: '90+ Days', amount: 9568728 }
    ];
    
    // Verify the values
    console.log('\n--- Verifying AR Aging values ---');
    let allCorrect = true;
    
    expectedValues.forEach(expected => {
      const actual = data.arAging.find(item => item.range === expected.range);
      
      if (!actual) {
        console.log(`❌ Missing data point for range: ${expected.range}`);
        allCorrect = false;
        return;
      }
      
      const isCorrect = actual.amount === expected.amount;
      console.log(`${expected.range}: $${actual.amount.toLocaleString()} (expected: $${expected.amount.toLocaleString()}) - ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      
      if (!isCorrect) {
        allCorrect = false;
      }
    });
    
    // Final result
    if (allCorrect) {
      console.log('\n✅ All AR Aging values are correct in the API response!');
      console.log('\nThe dashboard should now display the correct AR Aging data.');
    } else {
      console.log('\n❌ Some AR Aging values are not correct in the API response.');
      console.log('\nPlease check the dashboard API and the SQLite database.');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking dashboard API:', error.message);
    console.log('\nMake sure the Next.js server is running on port 3000.');
  }
  
  console.log('\n=== Dashboard API Check Completed ===');
}

// Run the check function
checkDashboardApi()
  .then(() => {
    console.log('Check completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
