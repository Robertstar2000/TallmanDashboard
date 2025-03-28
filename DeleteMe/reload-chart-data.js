/**
 * Reload Chart Data Script
 * This script forces a reload of the chart data from the initial-data.ts file into the SQLite database
 */

// Use dynamic import for TypeScript modules
async function reloadChartData() {
  try {
    console.log('Reloading chart data from initial-data.ts...');
    
    // Dynamically import the loadChartDataFromInitFile function
    const { loadChartDataFromInitFile } = await import('./lib/db/sqlite.js');
    
    // Call the function to reload the data
    await loadChartDataFromInitFile();
    
    console.log('Chart data reloaded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error reloading chart data:', error);
    process.exit(1);
  }
}

// Run the function
reloadChartData();
