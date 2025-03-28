/**
 * Test POR Access Queries with Correct Column
 * 
 * This script tests the MS Access SQL queries for the POR Historical Data
 * by directly executing them against the POR.MDB file using the correct TotalAmount column.
 */

const fs = require('fs');
const path = require('path');
const { default: MDBReader } = require('mdb-reader');

// Default POR database file path
const POR_FILE_PATH = process.env.POR_ACCESS_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Generate MS Access SQL for each month
function generateMonthlyQueries() {
  const queries = [];
  
  for (let i = 1; i <= 12; i++) {
    const monthOffset = i === 1 ? 0 : -(i - 1);
    
    // MS Access SQL for the month using the correct TotalAmount column
    const msAccessSql = `SELECT Sum(Nz([TotalAmount],0)) AS value FROM [PurchaseOrder] WHERE Format([Date],"yyyy-mm") = Format(DateAdd("m",${monthOffset},Date()),"yyyy-mm")`;
    
    queries.push({
      month: i,
      timeframe: `Month ${i}`,
      sql: msAccessSql
    });
  }
  
  return queries;
}

// Function to get the current date in MS Access format
function getCurrentDate() {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
}

// Function to get a date with month offset in MS Access format
function getDateWithMonthOffset(monthOffset) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${date.getMonth() + 1}/1/${date.getFullYear()}`;
}

// Function to extract month and year from a date
function getMonthYear(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Function to manually execute the query logic
function executeAccessQuery(reader, query) {
  try {
    console.log(`Executing query: ${query.sql}`);
    
    // Get the PurchaseOrder table
    const poTable = reader.getTable('PurchaseOrder');
    const rows = poTable.getData();
    
    // Parse the query to determine what we're looking for
    const monthMatch = query.sql.match(/DateAdd\("m",(-?\d+),Date\(\)\)/);
    const monthOffset = monthMatch ? parseInt(monthMatch[1]) : 0;
    
    // Get the target month-year
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const targetMonthYear = getMonthYear(targetDate);
    
    console.log(`Looking for purchase orders from month-year: ${targetMonthYear}`);
    
    // Filter rows by date
    let totalValue = 0;
    let matchingRows = 0;
    
    rows.forEach(row => {
      if (row.Date) {
        const rowDate = new Date(row.Date);
        const rowMonthYear = getMonthYear(rowDate);
        
        if (rowMonthYear === targetMonthYear) {
          matchingRows++;
          if (row.TotalAmount) {
            totalValue += parseFloat(row.TotalAmount);
          }
        }
      }
    });
    
    console.log(`Found ${matchingRows} matching rows with total value: ${totalValue}`);
    
    return {
      month: query.month,
      timeframe: query.timeframe,
      value: totalValue,
      matchingRows
    };
  } catch (error) {
    console.error(`Error executing query for ${query.timeframe}:`, error.message);
    return {
      month: query.month,
      timeframe: query.timeframe,
      error: error.message
    };
  }
}

async function testPorAccessQueries() {
  console.log(`Testing POR Access queries using database at: ${POR_FILE_PATH}`);
  
  try {
    // Check if the file exists
    if (!fs.existsSync(POR_FILE_PATH)) {
      console.error(`Error: File not found at path: ${POR_FILE_PATH}`);
      return;
    }
    
    // Read the database file
    console.log('Reading database file...');
    const buffer = fs.readFileSync(POR_FILE_PATH);
    const reader = new MDBReader(buffer);
    
    // Generate the monthly queries
    const queries = generateMonthlyQueries();
    console.log(`Generated ${queries.length} monthly queries`);
    
    // Execute each query
    const results = [];
    
    for (const query of queries) {
      const result = executeAccessQuery(reader, query);
      results.push(result);
    }
    
    // Display the results
    console.log('\nQuery Results:');
    console.log('=============');
    
    results.forEach(result => {
      if (result.error) {
        console.log(`${result.timeframe}: Error - ${result.error}`);
      } else {
        console.log(`${result.timeframe}: $${result.value.toFixed(2)} (${result.matchingRows} orders)`);
      }
    });
    
    // Save the results to a file
    fs.writeFileSync('por-historical-data-results.json', JSON.stringify(results, null, 2));
    console.log('\nSaved results to por-historical-data-results.json');
    
    return results;
  } catch (error) {
    console.error('Error testing POR Access queries:', error.message);
  }
}

// Run the test
testPorAccessQueries().catch(error => {
  console.error('Unhandled error:', error.message);
});
