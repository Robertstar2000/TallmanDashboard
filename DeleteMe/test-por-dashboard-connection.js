/**
 * Test POR Dashboard Connection
 * 
 * This script tests the connection to the POR database from the dashboard application
 * and executes a sample query to verify that the connection is working properly.
 */

const fs = require('fs');
const path = require('path');
const { default: MDBReader } = require('mdb-reader');

// Default POR database file path
const POR_FILE_PATH = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Function to test the connection to the POR database
async function testPorDashboardConnection() {
  console.log(`Testing POR dashboard connection using database at: ${POR_FILE_PATH}`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(POR_FILE_PATH)) {
      console.error(`Error: File not found at path: ${POR_FILE_PATH}`);
      return { success: false, message: `File not found at path: ${POR_FILE_PATH}` };
    }
    
    // Read the database file
    console.log('Reading database file...');
    const buffer = fs.readFileSync(POR_FILE_PATH);
    const reader = new MDBReader(buffer);
    
    // Get the tables in the database
    const tables = reader.getTableNames();
    console.log(`Database contains ${tables.length} tables`);
    
    // Check if the PurchaseOrder table exists
    if (!tables.includes('PurchaseOrder')) {
      console.error('Error: PurchaseOrder table not found in the database');
      return { success: false, message: 'PurchaseOrder table not found in the database' };
    }
    
    // Get the PurchaseOrder table
    const poTable = reader.getTable('PurchaseOrder');
    const rowCount = poTable.rowCount;
    console.log(`PurchaseOrder table contains ${rowCount} rows`);
    
    // Execute a sample query to get the total purchase order amount for the current month
    const now = new Date();
    const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    console.log(`Executing sample query for current month: ${currentMonthYear}`);
    
    const rows = poTable.getData();
    let totalAmount = 0;
    let matchingRows = 0;
    
    rows.forEach(row => {
      if (row.Date) {
        const rowDate = new Date(row.Date);
        const rowMonthYear = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (rowMonthYear === currentMonthYear) {
          matchingRows++;
          if (row.TotalAmount) {
            totalAmount += parseFloat(row.TotalAmount);
          }
        }
      }
    });
    
    console.log(`Found ${matchingRows} matching rows for current month with total value: $${totalAmount.toFixed(2)}`);
    
    // Test the connection for the Historical Data chart
    console.log('\nTesting Historical Data queries:');
    
    const historicalResults = [];
    
    for (let i = 0; i < 12; i++) {
      const monthOffset = -i;
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const targetMonthYear = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      
      let monthTotal = 0;
      let monthRows = 0;
      
      rows.forEach(row => {
        if (row.Date) {
          const rowDate = new Date(row.Date);
          const rowMonthYear = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (rowMonthYear === targetMonthYear) {
            monthRows++;
            if (row.TotalAmount) {
              monthTotal += parseFloat(row.TotalAmount);
            }
          }
        }
      });
      
      historicalResults.push({
        month: i + 1,
        monthYear: targetMonthYear,
        value: monthTotal,
        rowCount: monthRows
      });
      
      console.log(`Month ${i + 1} (${targetMonthYear}): $${monthTotal.toFixed(2)} (${monthRows} orders)`);
    }
    
    // Save the results to a file
    fs.writeFileSync('por-dashboard-connection-test.json', JSON.stringify({
      success: true,
      message: 'POR dashboard connection test successful',
      databasePath: POR_FILE_PATH,
      tableCount: tables.length,
      purchaseOrderCount: rowCount,
      currentMonthTotal: totalAmount,
      currentMonthOrders: matchingRows,
      historicalResults
    }, null, 2));
    
    console.log('\nSaved results to por-dashboard-connection-test.json');
    
    return {
      success: true,
      message: 'POR dashboard connection test successful',
      databasePath: POR_FILE_PATH,
      tableCount: tables.length,
      purchaseOrderCount: rowCount,
      currentMonthTotal: totalAmount,
      currentMonthOrders: matchingRows,
      historicalResults
    };
  } catch (error) {
    console.error('Error testing POR dashboard connection:', error.message);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Run the test
testPorDashboardConnection().catch(error => {
  console.error('Unhandled error:', error.message);
});
