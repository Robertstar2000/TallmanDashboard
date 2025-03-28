const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to verify that the AR Aging data is correctly stored in the SQLite database
 */
async function verifyArAgingSqlite() {
  console.log('=== Verifying AR Aging Data in SQLite ===');
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
    
    // Expected values based on our fix script
    const expectedValues = {
      'Current': '$0',
      '1-30 Days': '$0',
      '31-60 Days': '$0',
      '61-90 Days': '$1,168',
      '90+ Days': '$9,568,728'
    };
    
    // Check each value
    console.log('\n--- Verifying AR Aging values ---');
    let allValuesCorrect = true;
    
    arAgingRows.forEach(row => {
      const variableName = row.variableName;
      const value = row.value;
      const expectedValue = expectedValues[variableName];
      
      if (expectedValue === undefined) {
        console.log(`⚠️ No expected value for variable "${variableName}"`);
        return;
      }
      
      const isCorrect = value === expectedValue;
      
      console.log(`${variableName}: ${value} (expected: ${expectedValue}) - ${isCorrect ? '✅ Correct' : '❌ Incorrect'}`);
      
      if (!isCorrect) {
        allValuesCorrect = false;
      }
    });
    
    // Final result
    if (allValuesCorrect) {
      console.log('\n✅ All AR Aging values are correct in the SQLite database!');
    } else {
      console.log('\n❌ Some AR Aging values are not correct in the SQLite database.');
    }
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Data Verification Completed ===');
}

// Run the verification function
verifyArAgingSqlite()
  .then(() => {
    console.log('Verification completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
