// Script to clear the chart data cache and force a refresh
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function clearCache() {
  try {
    console.log('Clearing dashboard cache...');
    
    // Call the API endpoint to clear the cache
    const response = await fetch('http://localhost:3000/api/dashboard/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to clear cache: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Cache cleared successfully:', result);
    
    // Now refresh the dashboard data
    console.log('Refreshing dashboard data...');
    const refreshResponse = await fetch('http://localhost:3000/api/dashboard/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!refreshResponse.ok) {
      throw new Error(`Failed to refresh data: ${refreshResponse.status} ${refreshResponse.statusText}`);
    }
    
    const refreshResult = await refreshResponse.json();
    console.log('Data refreshed successfully:', refreshResult);
    
    console.log('Done! The dashboard should now display the correct row IDs.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

clearCache();
