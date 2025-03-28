// Script to test the dashboard API and verify the correct number of items for each chart group
const http = require('http');
const fs = require('fs');

// Expected counts for each chart group in the API response
// Note: These are the expected output counts after transformation, not the input row counts
const expectedCounts = {
  'Key Metrics': 7,
  'Accounts': 12,         // 12 months, each with 3 variables
  'Customer Metrics': 12,  // 12 months, each with 2 variables
  'Inventory': 4,          // 4 departments, each with 2 variables
  'Site Distribution': 3,
  'AR Aging': 5,
  'Daily Orders': 7,
  'Web Orders': 12,        // 12 months
  'POR Overview': 12,      // 12 months, each with 3 variables
  'Historical Data': 12,   // 12 months, each with 3 variables
  'Open Orders': 12,
};

// API field to chart group mapping
const apiFieldToChartGroup = {
  'metrics': 'Key Metrics',
  'historicalData': 'Historical Data',
  'accounts': 'Accounts',
  'customerMetrics': 'Customer Metrics',
  'inventory': 'Inventory',
  'porOverview': 'POR Overview',
  'siteDistribution': 'Site Distribution',
  'arAging': 'AR Aging',
  'dailyOrders': 'Daily Orders',
  'webOrders': 'Web Orders',
  'openOrders': 'Open Orders'
};

// Function to make an HTTP GET request
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error(`Invalid content-type.\nExpected application/json but received ${contentType}`);
      }
      
      if (error) {
        console.error(error.message);
        res.resume();
        reject(error);
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          console.error(e.message);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
      reject(e);
    });
  });
}

// Function to test the dashboard API
async function testDashboardAPI() {
  console.log('Testing Dashboard API...');
  
  try {
    // Get dashboard data from API
    const data = await httpGet('http://localhost:3000/api/dashboard/data');
    
    // Create results array for logging
    const results = [];
    results.push('# Dashboard API Data Analysis');
    results.push('');
    
    // Check if we got a valid response
    if (!data) {
      results.push('Error: No data received from API');
      console.error('Error: No data received from API');
      return;
    }
    
    // Analyze each chart group
    for (const [apiField, chartGroup] of Object.entries(apiFieldToChartGroup)) {
      const chartData = data[apiField];
      
      if (!chartData) {
        results.push(`## ${chartGroup} (${apiField}): Missing data`);
        console.log(`${chartGroup} (${apiField}): Missing data`);
        continue;
      }
      
      const actualCount = Array.isArray(chartData) ? chartData.length : 0;
      const expectedCount = expectedCounts[chartGroup] || 0;
      const countMatch = actualCount === expectedCount ? 'MATCH' : 'MISMATCH';
      
      results.push(`## ${chartGroup} (${apiField}): ${actualCount} items (Expected: ${expectedCount}) - ${countMatch}`);
      console.log(`${chartGroup} (${apiField}): ${actualCount} items (Expected: ${expectedCount}) - ${countMatch}`);
      
      // Detailed analysis for specific chart groups
      if (apiField === 'accounts') {
        results.push('\n### Accounts Data Analysis:');
        
        // Check if all months have data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsFound = chartData.map(item => item.date);
        const missingMonths = months.filter(month => !monthsFound.includes(month));
        
        results.push(`Months found: ${monthsFound.join(', ')}`);
        if (missingMonths.length > 0) {
          results.push(`Missing months: ${missingMonths.join(', ')}`);
        }
        
        // Check if all data types have values
        let payableZeroCount = 0;
        let receivableZeroCount = 0;
        let overdueZeroCount = 0;
        
        chartData.forEach(item => {
          if (item.payable === 0) payableZeroCount++;
          if (item.receivable === 0) receivableZeroCount++;
          if (item.overdue === 0) overdueZeroCount++;
          
          results.push(`${item.date}: Payable=${item.payable}, Receivable=${item.receivable}, Overdue=${item.overdue}`);
        });
        
        results.push(`\nZero value counts: Payable=${payableZeroCount}, Receivable=${receivableZeroCount}, Overdue=${overdueZeroCount}`);
      }
      
      if (apiField === 'historicalData') {
        results.push('\n### Historical Data Analysis:');
        
        // Check if all months have data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthsFound = chartData.map(item => item.date);
        const missingMonths = months.filter(month => !monthsFound.includes(month));
        
        results.push(`Months found: ${monthsFound.join(', ')}`);
        if (missingMonths.length > 0) {
          results.push(`Missing months: ${missingMonths.join(', ')}`);
        }
        
        // Check if all data types have values
        let salesZeroCount = 0;
        let ordersZeroCount = 0;
        let combinedZeroCount = 0;
        
        chartData.forEach(item => {
          if (item.sales === 0) salesZeroCount++;
          if (item.orders === 0) ordersZeroCount++;
          if (item.combined === 0) combinedZeroCount++;
          
          results.push(`${item.date}: P21 (sales)=${item.sales}, POR (orders)=${item.orders}, Total (combined)=${item.combined}`);
        });
        
        results.push(`\nZero value counts: P21 (sales)=${salesZeroCount}, POR (orders)=${ordersZeroCount}, Total (combined)=${combinedZeroCount}`);
      }
      
      results.push('');
    }
    
    // Write results to file
    fs.writeFileSync('dashboard-api-test-results.txt', results.join('\n'));
    console.log('Results written to dashboard-api-test-results.txt');
    
  } catch (error) {
    console.error('Error testing dashboard API:', error);
  }
}

// Run the test
testDashboardAPI();
