/**
 * Test POR Overview Integration
 * 
 * This script tests the integration between the dashboard and the POR database,
 * verifying that we can retrieve overview data correctly.
 */

const fs = require('fs');
const path = require('path');
const { default: MDBReader } = require('mdb-reader');
const sqlite3 = require('sqlite3').verbose();

// Default POR database file path
const POR_FILE_PATH = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Get the data directory path
function getDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

// Get the database path
function getDbPath() {
  return path.join(getDataDir(), 'dashboard.db');
}

// Execute a SQL query with parameters
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
    console.log('Reading admin_variables table for POR Overview Group...');
    
    // Get all POR Overview Group rows
    const sql = "SELECT * FROM admin_variables WHERE chart_group = 'Overview' AND server_name = 'POR'";
    const result = await executeSql(sql);
    
    if (!result || result.length === 0) {
      console.error('Error: No POR Overview Group rows found in admin_variables table');
      return [];
    }
    
    console.log(`Found ${result.length} POR Overview Group rows`);
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
      console.log(`\nTesting query for ${query.chart_name}:`);
      console.log(query.production_sql_expression);
      
      // Get the PurchaseOrder table
      const poTable = reader.getTable('PurchaseOrder');
      const rows = poTable.getData();
      
      // Execute the query based on its type
      let value = 0;
      
      if (query.production_sql_expression.includes('Count(*)')) {
        // Count query
        if (query.production_sql_expression.includes("WHERE [Status] = 'O'")) {
          // Open purchase orders
          value = rows.filter(row => row.Status === 'O').length;
        } else if (query.production_sql_expression.includes("WHERE [Status] = 'C'")) {
          // Completed purchase orders
          value = rows.filter(row => row.Status === 'C').length;
        } else if (query.production_sql_expression.includes("Format([Date],'yyyy-mm') = Format(Date(),'yyyy-mm')")) {
          // Current month purchase orders
          const now = new Date();
          const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          value = rows.filter(row => {
            if (!row.Date) return false;
            const rowDate = new Date(row.Date);
            const rowMonthYear = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
            return rowMonthYear === currentMonthYear;
          }).length;
        } else {
          // Total purchase orders
          value = rows.length;
        }
      } else if (query.production_sql_expression.includes('Sum(Nz([TotalAmount],0))')) {
        // Sum query
        if (query.production_sql_expression.includes("Format([Date],'yyyy-mm') = Format(Date(),'yyyy-mm')")) {
          // Current month purchase amount
          const now = new Date();
          const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          value = rows.reduce((sum, row) => {
            if (!row.Date) return sum;
            const rowDate = new Date(row.Date);
            const rowMonthYear = `${rowDate.getFullYear()}-${String(rowDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (rowMonthYear === currentMonthYear && row.TotalAmount) {
              return sum + parseFloat(row.TotalAmount);
            }
            return sum;
          }, 0);
        } else {
          // Total purchase amount
          value = rows.reduce((sum, row) => {
            return sum + (row.TotalAmount ? parseFloat(row.TotalAmount) : 0);
          }, 0);
        }
      } else if (query.production_sql_expression.includes('Avg(Nz([TotalAmount],0))')) {
        // Average query
        const validRows = rows.filter(row => row.TotalAmount && parseFloat(row.TotalAmount) > 0);
        const total = validRows.reduce((sum, row) => sum + parseFloat(row.TotalAmount), 0);
        value = validRows.length > 0 ? total / validRows.length : 0;
      }
      
      console.log(`Result: ${value}`);
      
      results.push({
        id: query.id,
        chart_name: query.chart_name,
        sql: query.production_sql_expression,
        value: value
      });
    } catch (error) {
      console.error(`Error testing query for ${query.chart_name}:`, error.message);
      results.push({
        id: query.id,
        chart_name: query.chart_name,
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
    console.log('\nUpdating admin_variables table with test results...');
    
    // Update each row directly
    for (const result of testResults) {
      if (result.error) {
        console.log(`Skipping update for ${result.chart_name} due to error: ${result.error}`);
        continue;
      }
      
      const updateSql = "UPDATE admin_variables SET value = ? WHERE id = ?";
      await executeSql(updateSql, [result.value.toString(), result.id]);
      
      console.log(`Updated ${result.chart_name} with value: ${result.value}`);
    }
    
    console.log('Update complete');
    return true;
  } catch (error) {
    console.error('Error updating admin_variables:', error.message);
    return false;
  }
}

async function testPorOverviewIntegration() {
  console.log(`Testing POR Overview integration using database at: ${POR_FILE_PATH}`);
  
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
      console.error('Error: No POR Overview Group rows found in admin_variables table');
      return { success: false, message: 'No POR Overview Group rows found in admin_variables table' };
    }
    
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
    
    return { success: true, message: 'POR Overview integration test completed successfully', results: testResults };
  } catch (error) {
    console.error('Error testing POR Overview integration:', error.message);
    return { success: false, message: `Error testing POR Overview integration: ${error.message}` };
  }
}

// Run the test
testPorOverviewIntegration().then(result => {
  console.log('\nTest result:', result.success ? 'SUCCESS' : 'FAILURE');
  console.log(result.message);
  
  if (result.results) {
    console.log('\nSummary of test results:');
    result.results.forEach(r => {
      console.log(`${r.chart_name}: ${r.error ? 'ERROR - ' + r.error : r.value}`);
    });
  }
}).catch(error => {
  console.error('Unhandled error:', error.message);
});
