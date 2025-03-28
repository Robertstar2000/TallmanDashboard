// Test script for dashboard data API
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard/data',
  method: 'GET'
};

console.log('Sending request to dashboard data API...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const dashboardData = JSON.parse(data);
      
      // Log summary of dashboard data
      console.log('\nDashboard Data Summary:');
      console.log(`- Metrics: ${dashboardData.metrics.length} items`);
      console.log(`- Historical Data: ${dashboardData.historicalData.length} items`);
      console.log(`- Accounts: ${dashboardData.accounts.length} items`);
      console.log(`- Customer Metrics: ${dashboardData.customerMetrics.length} items`);
      console.log(`- Inventory: ${dashboardData.inventory.length} items`);
      console.log(`- POR Overview: ${dashboardData.porOverview.length} items`);
      console.log(`- Site Distribution: ${dashboardData.siteDistribution.length} items`);
      console.log(`- AR Aging: ${dashboardData.arAging.length} items`);
      console.log(`- Daily Orders: ${dashboardData.dailyOrders.length} items`);
      console.log(`- Web Orders: ${dashboardData.webOrders.length} items`);
      
      // Check if any metrics have empty names
      const emptyNames = [];
      
      if (dashboardData.metrics.some(item => !item.name)) {
        emptyNames.push('Metrics');
      }
      
      if (dashboardData.siteDistribution.some(item => !item.name)) {
        emptyNames.push('Site Distribution');
      }
      
      if (emptyNames.length > 0) {
        console.log(`\nWARNING: Found empty names in: ${emptyNames.join(', ')}`);
      } else {
        console.log('\nAll chart items have valid names');
      }
      
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  });
});

req.on('error', (error) => {
  console.error(`Error making request: ${error.message}`);
});

req.end();
