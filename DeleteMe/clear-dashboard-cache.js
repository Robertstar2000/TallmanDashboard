const fs = require('fs');
const path = require('path');

/**
 * Script to clear the dashboard cache and force it to reload data from the SQLite database
 * 
 * This script will:
 * 1. Create a cache-busting file that will force the dashboard to reload data
 * 2. Provide instructions on how to refresh the dashboard
 */
function clearDashboardCache() {
  console.log('=== Clearing Dashboard Cache ===');
  
  try {
    // Create the data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory at ${dataDir}`);
    }
    
    // Create a cache-busting file
    const cacheFile = path.join(dataDir, 'cache-refresh.txt');
    const timestamp = new Date().toISOString();
    
    fs.writeFileSync(cacheFile, timestamp);
    console.log(`Created cache-busting file at ${cacheFile} with timestamp ${timestamp}`);
    
    // Create a simple API endpoint to clear cache
    const apiDir = path.join(process.cwd(), 'app', 'api', 'dashboard', 'clear-cache');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
      console.log(`Created API directory at ${apiDir}`);
    }
    
    const routeFile = path.join(apiDir, 'route.ts');
    const routeContent = `
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Create a cache-busting file
    const dataDir = path.join(process.cwd(), 'data');
    const cacheFile = path.join(dataDir, 'cache-refresh.txt');
    const timestamp = new Date().toISOString();
    
    fs.writeFileSync(cacheFile, timestamp);
    
    return NextResponse.json({
      success: true,
      message: 'Dashboard cache cleared successfully',
      timestamp
    });
  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear dashboard cache' },
      { status: 500 }
    );
  }
}
`;
    
    fs.writeFileSync(routeFile, routeContent);
    console.log(`Created API route at ${routeFile}`);
    
    // Modify the dashboard data route to check for the cache-busting file
    const dataRouteFile = path.join(process.cwd(), 'app', 'api', 'dashboard', 'data', 'route.ts');
    let dataRouteContent = fs.readFileSync(dataRouteFile, 'utf8');
    
    // Check if the route already has cache-busting logic
    if (!dataRouteContent.includes('cache-refresh.txt')) {
      console.log('Adding cache-busting logic to dashboard data route');
      
      // Find the beginning of the GET function
      const functionStart = dataRouteContent.indexOf('export async function GET()');
      const functionBody = dataRouteContent.indexOf('{', functionStart) + 1;
      
      // Add cache-busting check
      const cacheBustingCode = `
  // Check for cache-busting file
  try {
    const cacheFile = path.join(process.cwd(), 'data', 'cache-refresh.txt');
    if (fs.existsSync(cacheFile)) {
      console.log('Cache-busting file found, clearing chart data cache');
      // Clear any cached data (this will force a fresh fetch from the database)
      global.chartDataCache = null;
    }
  } catch (error) {
    console.error('Error checking cache-busting file:', error);
  }
`;
      
      // Add imports if needed
      let importsUpdated = dataRouteContent;
      if (!importsUpdated.includes('import fs from')) {
        importsUpdated = `import fs from 'fs';\nimport path from 'path';\n${importsUpdated}`;
      }
      
      // Insert the cache-busting code
      const updatedContent = importsUpdated.slice(0, functionBody) + cacheBustingCode + importsUpdated.slice(functionBody);
      
      fs.writeFileSync(dataRouteFile, updatedContent);
      console.log(`Updated dashboard data route at ${dataRouteFile}`);
    } else {
      console.log('Dashboard data route already has cache-busting logic');
    }
    
    console.log('\n=== Dashboard Cache Clearing Completed ===');
    console.log('\nTo see the updated AR Aging data:');
    console.log('1. Restart the Next.js server: npm run dev');
    console.log('2. Open the dashboard in your browser: http://localhost:3000');
    console.log('3. The dashboard should now display the correct AR Aging data');
    
  } catch (error) {
    console.error('Error clearing dashboard cache:', error);
  }
}

clearDashboardCache();
