/**
 * Test script for direct POR database access
 * 
 * This script tests the PORDirectReader implementation for accessing purchase order data
 * from the POR database without requiring ODBC or the Microsoft Access Database Engine.
 */

// Since we're using a TypeScript module in a JavaScript file, we need to use require with the compiled JS file
const { PORDirectReader } = require('../dist/lib/db/por-direct-reader');
const fs = require('fs');

// Path to the MS Access database
const dbPath = 'C:\\Users\\BobM\\Desktop\\POR.mdb';

// Check if the database file exists
if (!fs.existsSync(dbPath)) {
  console.error(`Error: MS Access file not found at path: ${dbPath}`);
  console.error('Please ensure the file exists at the specified location.');
  process.exit(1);
}

// Create a server config
const config = {
  type: 'POR',
  server: 'local',
  database: 'POR',
  filePath: dbPath
};

// Test the PORDirectReader implementation
async function testPORDirectReader() {
  console.log('Testing PORDirectReader implementation...');
  
  try {
    // Create a POR direct reader
    const reader = new PORDirectReader(config);
    
    // Connect to the database
    console.log('Connecting to POR database...');
    const connectionResult = await reader.connect();
    
    if (!connectionResult.success) {
      console.error(`Connection failed: ${connectionResult.message}`);
      process.exit(1);
    }
    
    console.log(`Connection successful: ${connectionResult.message}`);
    
    // Test finding purchase order tables
    console.log('\nFinding purchase order tables...');
    const poTables = await reader.findPurchaseOrderTable();
    
    if (poTables.length === 0) {
      console.log('No purchase order tables found.');
    } else {
      console.log(`Found ${poTables.length} potential purchase order tables:`);
      poTables.forEach(table => {
        console.log(`- ${table.name} (${table.confidence}% confidence)`);
      });
      
      // Get the most likely purchase order table
      const bestTable = poTables[0];
      console.log(`\nMost likely purchase order table: ${bestTable.name} (${bestTable.confidence}% confidence)`);
      
      // Test getting purchase order counts
      console.log('\nTesting purchase order count methods...');
      
      // Get current month count
      const currentMonthCount = await reader.getCurrentMonthPurchaseOrderCount();
      console.log(`Current month purchase order count: ${currentMonthCount}`);
      
      // Get monthly counts
      const monthlyCounts = await reader.getMonthlyPurchaseOrderCounts();
      console.log('\nMonthly purchase order counts:');
      Object.entries(monthlyCounts).forEach(([month, count]) => {
        console.log(`- ${month}: ${count}`);
      });
      
      // Get monthly comparison
      const monthlyComparison = await reader.getMonthlyPurchaseOrderComparison();
      console.log('\nMonthly purchase order comparison:');
      console.log(`- Current Month: ${monthlyComparison.currentMonth}`);
      console.log(`- Previous Month: ${monthlyComparison.previousMonth}`);
      console.log(`- Same Month Last Year: ${monthlyComparison.sameMonthLastYear}`);
      console.log(`- Change from Previous Month: ${monthlyComparison.changeFromPreviousMonth}%`);
      console.log(`- Change from Same Month Last Year: ${monthlyComparison.changeFromLastYear}%`);
    }
    
    // Close the connection
    reader.close();
    console.log('\nTest completed successfully.');
  } catch (error) {
    console.error('Error testing PORDirectReader:', error);
  }
}

// Run the test
testPORDirectReader();
