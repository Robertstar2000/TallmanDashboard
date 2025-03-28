/**
 * Debug API Route
 * 
 * This script tests the getChartData function directly to see why the API is failing
 */

import { getChartData } from '../lib/db/sqlite';

async function debugApi() {
  try {
    console.log('Testing getChartData function directly...');
    
    // Get chart data from database
    const chartData = await getChartData();
    
    console.log(`Retrieved ${chartData ? chartData.length : 0} rows of chart data`);
    
    if (!chartData || chartData.length === 0) {
      console.log('No data returned from getChartData');
    } else {
      console.log('First row:', chartData[0]);
      
      // Check for any issues with the data
      const missingFields = chartData.filter(row => !row.chartGroup || !row.variableName);
      if (missingFields.length > 0) {
        console.log(`Found ${missingFields.length} rows with missing required fields`);
        console.log('Example of problematic row:', missingFields[0]);
      }
      
      // Check chart groups
      const chartGroups = [...new Set(chartData.map(row => row.chartGroup))];
      console.log('Chart groups present:', chartGroups);
    }
    
  } catch (error) {
    console.error('Error debugging API:', error instanceof Error ? error.message : String(error));
  }
}

// Run the script
debugApi().catch(error => {
  console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
});
