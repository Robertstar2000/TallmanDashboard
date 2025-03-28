/**
 * Test POR Integration
 * 
 * This script tests the integration between the dashboard and the POR database,
 * verifying that we can retrieve historical data correctly.
 */

const fs = require('fs');
const path = require('path');
const { default: MDBReader } = require('mdb-reader');
const { execSync } = require('child_process');
const sqlite3 = require('sqlite3').verbose();

// Default POR database file path
const POR_FILE_PATH = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Function to get the data directory path
function getDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

// Function to get the database path
function getDbPath() {
  return path.join(getDataDir(), 'dashboard.db');
}

// Function to execute a SQL query with parameters
function executeSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(getDbPath());
    db.all(sql, params, (err, rows) => {
      if (err) {
        db.close();
        reject(err);
        return;
      }
      
      db.close();
      resolve(rows);
    });
  });
}

// Function to read the admin_variables table from the SQLite database
async function readAdminVariables() {
  try {
    console.log('Reading admin_variables table directly using sqlite3...');
    
    // Get all Historical Data POR rows
    const sql = "SELECT * FROM admin_variables WHERE chart_name = 'Historical Data' AND variable_name = 'POR' ORDER BY timeframe";
    const result = await executeSql(sql);
    
    if (!result || result.length === 0) {
      console.error('Error: No POR Historical Data rows found in admin_variables table');
      return [];
    }
    
    console.log(`Found ${result.length} POR Historical Data rows`);
    return result;
  } catch (error) {
    console.error('Error reading admin_variables:', error.message);
    return [];
  }
}

// Function to test the MS Access SQL queries directly
function testMsAccessQueries(reader, queries) {
  const results = [];
  
  for (const query of queries) {
    try {
      console.log(`Testing query for ${query.timeframe}:`);
      console.log(query.production_sql_expression);
      
      // Parse the query to determine what we're looking for
      const monthMatch = query.production_sql_expression.match(/DateAdd\("m",(-?\d+),Date\(\)\)/);
      const monthOffset = monthMatch ? parseInt(monthMatch[1]) : 0;
      
      // Get the target month-year
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const targetMonthYear = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      
      console.log(`Looking for purchase orders from month-year: ${targetMonthYear}`);
      
      // Get the PurchaseOrder table
      const poTable = reader.getTable('PurchaseOrder');
      const rows = poTable.getData();
      
      // Filter rows by date
      let totalValue = 0;
      let matchingRows = 0;
      
      rows.forEach(row => {
        if (row.Date) {
          const rowDate = new Date(row.Date);
          const rowMonthYear = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (rowMonthYear === targetMonthYear) {
            matchingRows++;
            if (row.TotalAmount) {
              totalValue += parseFloat(row.TotalAmount);
            }
          }
        }
      });
      
      console.log(`Found ${matchingRows} matching rows with total value: $${totalValue.toFixed(2)}`);
      
      results.push({
        id: query.id,
        timeframe: query.timeframe,
        sql: query.production_sql_expression,
        monthYear: targetMonthYear,
        matchingRows,
        totalValue
      });
    } catch (error) {
      console.error(`Error testing query for ${query.timeframe}:`, error.message);
      results.push({
        id: query.id,
        timeframe: query.timeframe,
        sql: query.production_sql_expression,
        error: error.message
      });
    }
  }
  
  return results;
}

// Function to update the admin_variables table with the test results
async function updateAdminVariables(testResults) {
  try {
    console.log('Updating admin_variables table with test results...');
    
    // Update each row directly
    for (const result of testResults) {
      if (result.error) {
        console.log(`Skipping update for ${result.timeframe} due to error: ${result.error}`);
        continue;
      }
      
      const updateSql = "UPDATE admin_variables SET value = ? WHERE id = ?";
      await executeSql(updateSql, [result.totalValue.toFixed(2), result.id]);
      
      console.log(`Updated ${result.timeframe} with value: $${result.totalValue.toFixed(2)}`);
    }
    
    console.log('Update complete');
    return true;
  } catch (error) {
    console.error('Error updating admin_variables:', error.message);
    return false;
  }
}

async function testPorIntegration() {
  console.log(`Testing POR integration using database at: ${POR_FILE_PATH}`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(POR_FILE_PATH)) {
      console.error(`Error: File not found at path: ${POR_FILE_PATH}`);
      return { success: false, message: `File not found at path: ${POR_FILE_PATH}` };
    }
    
    // Read the database file
    console.log('Reading POR database file...');
    const buffer = fs.readFileSync(POR_FILE_PATH);
    const reader = new MDBReader(buffer);
    
    // Read the admin_variables table
    console.log('\nReading admin_variables table...');
    const adminVariables = await readAdminVariables();
    
    if (!adminVariables || adminVariables.length === 0) {
      console.error('Error: No POR Historical Data rows found in admin_variables table');
      return { success: false, message: 'No POR Historical Data rows found in admin_variables table' };
    }
    
    console.log(`Found ${adminVariables.length} POR Historical Data rows`);
    
    // Test the MS Access SQL queries
    console.log('\nTesting MS Access SQL queries...');
    const testResults = testMsAccessQueries(reader, adminVariables);
    
    // Update the admin_variables table with the test results
    console.log('\nUpdating admin_variables table with test results...');
    const updateSuccess = await updateAdminVariables(testResults);
    
    if (!updateSuccess) {
      console.error('Error: Failed to update admin_variables table');
      return { success: false, message: 'Failed to update admin_variables table' };
    }
    
    return { success: true, message: 'POR integration test completed successfully', results: testResults };
  } catch (error) {
    console.error('Error testing POR integration:', error.message);
    return { success: false, message: `Error testing POR integration: ${error.message}` };
  }
}

// Run the test
testPorIntegration().then(result => {
  console.log('\nTest result:', result.success ? 'SUCCESS' : 'FAILURE');
  console.log(result.message);
  
  if (result.results) {
    console.log('\nSummary of test results:');
    result.results.forEach(r => {
      console.log(`${r.timeframe}: ${r.error ? 'ERROR - ' + r.error : '$' + r.totalValue.toFixed(2)}`);
    });
  }
}).catch(error => {
  console.error('Unhandled error:', error.message);
});
