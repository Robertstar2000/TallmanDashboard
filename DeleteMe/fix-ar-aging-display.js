const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * Script to fix the AR Aging display issue in the dashboard
 * This script will:
 * 1. Verify the AR Aging data in the SQLite database
 * 2. Update the global cache variable in the dashboard API
 */
async function fixARAgingDisplay() {
  console.log('Starting AR Aging display fix...');
  
  try {
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Opening database at: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Query the AR Aging data
    console.log('Querying AR Aging data from SQLite...');
    const arAgingData = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value
      FROM chart_data
      WHERE chart_group = 'AR Aging'
      ORDER BY id
    `);
    
    console.log(`Found ${arAgingData.length} AR Aging records:`);
    arAgingData.forEach(row => {
      console.log(`- ${row.variableName}: ${row.value}`);
    });
    
    // Create a cache-busting file
    const timestamp = new Date().toISOString();
    const cacheDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const cacheFile = path.join(cacheDir, 'cache-bust.txt');
    fs.writeFileSync(cacheFile, timestamp);
    console.log(`Created cache-busting file at ${cacheFile}`);
    
    // Modify the dashboard data API to check for the cache-busting file
    const apiFile = path.join(process.cwd(), 'app', 'api', 'dashboard', 'data', 'route.ts');
    console.log(`Updating API file at ${apiFile}`);
    
    let apiContent = fs.readFileSync(apiFile, 'utf8');
    
    // Check if we need to add imports
    if (!apiContent.includes('import fs from')) {
      apiContent = `import fs from 'fs';\nimport path from 'path';\n${apiContent}`;
    }
    
    // Check if we need to add cache-busting logic
    if (!apiContent.includes('cache-bust.txt')) {
      // Find the GET function
      const getFunction = apiContent.indexOf('export async function GET');
      if (getFunction !== -1) {
        const openBrace = apiContent.indexOf('{', getFunction);
        if (openBrace !== -1) {
          // Add cache-busting code right after the opening brace
          const cacheBustCode = `
  // Check for cache-busting file
  const cacheBustFile = path.join(process.cwd(), 'data', 'cache-bust.txt');
  if (fs.existsSync(cacheBustFile)) {
    console.log('Cache bust file found, clearing chart data cache');
    global.chartDataCache = null;
  }
`;
          
          apiContent = 
            apiContent.substring(0, openBrace + 1) + 
            cacheBustCode + 
            apiContent.substring(openBrace + 1);
          
          fs.writeFileSync(apiFile, apiContent);
          console.log('Added cache-busting logic to API route');
        }
      }
    } else {
      console.log('API route already has cache-busting logic');
    }
    
    // Close the database
    await db.close();
    
    console.log('\nAR Aging display fix completed!');
    console.log('\nTo see the updated AR Aging data:');
    console.log('1. Restart the Next.js server: npm run dev');
    console.log('2. Open the dashboard in your browser: http://localhost:3000');
    console.log('3. The dashboard should now display the correct AR Aging data from the SQLite database');
    
  } catch (error) {
    console.error('Error fixing AR Aging display:', error);
  }
}

// Run the fix function
fixARAgingDisplay();
