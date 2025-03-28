const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to update the AR Aging values in the SQLite database
 * This script will format the values correctly and ensure they match the expected values
 */
async function updateArAgingValues() {
  console.log('=== Updating AR Aging Values in SQLite ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the SQLite database
    console.log('\n--- Connecting to SQLite database ---');
    
    // Open the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log('✅ Connected successfully to SQLite database');
    
    // Check if the chart_data table exists
    const tableExists = await db.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='chart_data'
    `);
    
    if (!tableExists) {
      throw new Error('chart_data table does not exist in the SQLite database');
    }
    
    // Expected values for AR Aging
    const expectedValues = [
      { variableName: 'Current', value: '$0' },
      { variableName: '1-30 Days', value: '$0' },
      { variableName: '31-60 Days', value: '$0' },
      { variableName: '61-90 Days', value: '$1,168' },
      { variableName: '90+ Days', value: '$9,568,728' }
    ];
    
    // Get the AR Aging rows from the database
    const arAgingRows = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, last_updated as lastUpdated
      FROM chart_data
      WHERE chart_group = 'AR Aging'
      ORDER BY id
    `);
    
    console.log(`\nFound ${arAgingRows.length} AR Aging rows in SQLite database:`);
    
    // Log the current AR Aging data
    arAgingRows.forEach(row => {
      console.log(`- ${row.variableName}: ${row.value} (updated at ${row.lastUpdated})`);
    });
    
    // Update each value
    console.log('\n--- Updating AR Aging values ---');
    
    for (const row of arAgingRows) {
      const variableName = row.variableName;
      const expectedRow = expectedValues.find(r => r.variableName === variableName);
      
      if (!expectedRow) {
        console.log(`⚠️ No expected value for variable "${variableName}", skipping update`);
        continue;
      }
      
      const currentValue = row.value;
      const newValue = expectedRow.value;
      
      console.log(`Updating ${variableName}: ${currentValue} -> ${newValue}`);
      
      // Update the value in the database
      await db.run(`
        UPDATE chart_data
        SET value = ?, last_updated = ?
        WHERE id = ?
      `, [newValue, new Date().toISOString(), row.id]);
    }
    
    // Verify the updates
    console.log('\n--- Verifying updates ---');
    
    const updatedRows = await db.all(`
      SELECT id, chart_group as chartGroup, variable_name as variableName, value, last_updated as lastUpdated
      FROM chart_data
      WHERE chart_group = 'AR Aging'
      ORDER BY id
    `);
    
    updatedRows.forEach(row => {
      const expectedRow = expectedValues.find(r => r.variableName === row.variableName);
      const expectedValue = expectedRow ? expectedRow.value : 'Unknown';
      const isCorrect = row.value === expectedValue;
      
      console.log(`${row.variableName}: ${row.value} (expected: ${expectedValue}) - ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
    });
    
    // Create a cache-busting file to force the dashboard to reload data
    const timestamp = new Date().toISOString();
    const cacheDir = path.join(process.cwd(), 'data');
    const cacheFile = path.join(cacheDir, 'cache-refresh.txt');
    
    const fs = require('fs');
    fs.writeFileSync(cacheFile, timestamp);
    console.log(`\nCreated cache-busting file at ${cacheFile} with timestamp ${timestamp}`);
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== AR Aging Values Update Completed ===');
    console.log('\nTo see the updated AR Aging data:');
    console.log('1. Restart the Next.js server: npm run dev');
    console.log('2. Open the dashboard in your browser: http://localhost:3000');
    console.log('3. The dashboard should now display the correct AR Aging data');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the update function
updateArAgingValues()
  .then(() => {
    console.log('Update completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
