// Script to debug dashboard data flow
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function debugDashboardData() {
  try {
    console.log('Fetching dashboard data from API...');
    const response = await fetch('http://localhost:3000/api/dashboard/data');
    const data = await response.json();
    
    console.log('\n=== Dashboard Data Overview ===');
    console.log(`Metrics: ${data.metrics.length} items`);
    console.log(`Historical Data: ${data.historicalData.length} items`);
    console.log(`Accounts: ${data.accounts.length} items`);
    console.log(`Customer Metrics: ${data.customerMetrics.length} items`);
    console.log(`Inventory: ${data.inventory.length} items`);
    console.log(`POR Overview: ${data.porOverview.length} items`);
    console.log(`Site Distribution: ${data.siteDistribution.length} items`);
    console.log(`AR Aging: ${data.arAging.length} items`);
    console.log(`Daily Orders: ${data.dailyOrders.length} items`);
    console.log(`Web Orders: ${data.webOrders.length} items`);
    
    // Focus on Daily Orders data
    console.log('\n=== Daily Orders Data ===');
    if (data.dailyOrders && data.dailyOrders.length > 0) {
      console.log(JSON.stringify(data.dailyOrders, null, 2));
    } else {
      console.log('No Daily Orders data available');
    }
    
    // Save the entire dashboard data to a file for inspection
    const outputPath = path.join(__dirname, 'dashboard-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`\nSaved complete dashboard data to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
}

// Run the debug function
debugDashboardData();
