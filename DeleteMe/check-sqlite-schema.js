const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

/**
 * Script to check the SQLite database schema
 */
async function checkSqliteSchema() {
  console.log('=== Checking SQLite Database Schema ===');
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
    
    // Get the schema of the chart_data table
    console.log('\n--- Checking chart_data table schema ---');
    
    const tableInfo = await db.all(`PRAGMA table_info(chart_data)`);
    console.log('Table columns:');
    tableInfo.forEach(column => {
      console.log(`- ${column.name} (${column.type})`);
    });
    
    // Get a sample row to see the actual data
    console.log('\n--- Sample data from chart_data table ---');
    
    const sampleRow = await db.get(`SELECT * FROM chart_data LIMIT 1`);
    console.log('Sample row:', sampleRow);
    
    // Close the SQLite database
    await db.close();
    console.log('\n✅ SQLite Connection closed successfully');
    
    console.log('\n=== SQLite Schema Check Completed ===');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
}

// Run the check function
checkSqliteSchema()
  .then(() => {
    console.log('Check completed');
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  });
