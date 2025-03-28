const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Script to refresh the dashboard cache and force it to reload data from the SQLite database
 * 
 * This script will:
 * 1. Verify the AR Aging data in the SQLite database
 * 2. Create a cache-busting timestamp file that the dashboard will check
 * 3. Restart the Next.js server (optional)
 */
async function refreshDashboardCache() {
  console.log('=== Refreshing Dashboard Cache ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // First, verify the AR Aging data in the SQLite database
    console.log('\n--- Verifying AR Aging data in SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Get the AR Aging rows from the database
    const arAgingRows = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, last_updated as lastUpdated
      FROM chart_data
      WHERE chart_group = 'AR Aging'
      ORDER BY id
    `);
    
    console.log(`\nFound ${arAgingRows.length} AR Aging rows in SQLite database:`);
    
    // Log the AR Aging data
    arAgingRows.forEach(row => {
      console.log(`- ${row.variableName}: ${row.value} (updated at ${row.lastUpdated})`);
    });
    
    // Create a cache-busting timestamp file
    console.log('\n--- Creating cache-busting timestamp file ---');
    
    const timestamp = new Date().toISOString();
    const cacheFilePath = path.join(process.cwd(), 'data', 'cache-timestamp.txt');
    
    fs.writeFileSync(cacheFilePath, timestamp);
    console.log(`✅ Created cache timestamp file at ${cacheFilePath} with timestamp ${timestamp}`);
    
    // Create a cache-busting API route to force the dashboard to reload data
    console.log('\n--- Creating cache-busting API route ---');
    
    const apiDir = path.join(process.cwd(), 'app', 'api', 'dashboard');
    const refreshDir = path.join(apiDir, 'refresh');
    
    // Create the refresh directory if it doesn't exist
    if (!fs.existsSync(refreshDir)) {
      fs.mkdirSync(refreshDir, { recursive: true });
      console.log(`Created refresh API directory at ${refreshDir}`);
    }
    
    // Create the route.ts file
    const routeFilePath = path.join(refreshDir, 'route.ts');
    const routeContent = `
import { NextResponse } from 'next/server';
import { getChartData } from '@/lib/db/sqlite';

export async function GET() {
  try {
    // Force a refresh of the chart data
    console.log('Refreshing dashboard data cache');
    const chartData = await getChartData(true); // Pass true to force a refresh
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      rowCount: chartData.length,
      message: 'Dashboard data cache refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
`;
    
    fs.writeFileSync(routeFilePath, routeContent);
    console.log(`✅ Created refresh API route at ${routeFilePath}`);
    
    // Update the getChartData function to support forced refresh
    console.log('\n--- Checking if getChartData function needs to be updated ---');
    
    const sqliteFilePath = path.join(process.cwd(), 'lib', 'db', 'sqlite.ts');
    let sqliteContent = fs.readFileSync(sqliteFilePath, 'utf8');
    
    // Check if the function already has the forceRefresh parameter
    if (!sqliteContent.includes('forceRefresh')) {
      console.log('Updating getChartData function to support forced refresh');
      
      // Find the getChartData function
      const functionRegex = /export\s+async\s+function\s+getChartData\s*\(\s*\)\s*{/;
      const updatedContent = sqliteContent.replace(
        functionRegex,
        'export async function getChartData(forceRefresh: boolean = false) {'
      );
      
      // Add logic to force refresh
      const dbConnectRegex = /const\s+db\s*=\s*await\s+getDb\(\);/;
      const updatedDbConnect = `const db = await getDb();
  
  // If forceRefresh is true, clear any cached data
  if (forceRefresh) {
    console.log('Forcing refresh of chart data');
    chartDataCache = null;
  }`;
      
      const finalContent = updatedContent.replace(dbConnectRegex, updatedDbConnect);
      
      // Write the updated content back to the file
      fs.writeFileSync(sqliteFilePath, finalContent);
      console.log(`✅ Updated getChartData function in ${sqliteFilePath}`);
    } else {
      console.log('getChartData function already supports forced refresh');
    }
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== Dashboard Cache Refresh Completed ===');
    console.log('\nTo refresh the dashboard data, visit: http://localhost:3000/api/dashboard/refresh');
    console.log('Then reload the dashboard page to see the updated AR Aging data.');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the refresh function
refreshDashboardCache()
  .then(() => {
    console.log('Refresh completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
