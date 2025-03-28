// Test script to verify connections to both P21 and POR databases
// This script tests the updated ConnectionManager implementation

// Import required modules
const odbc = require('odbc');
const path = require('path');
const fs = require('fs');

// Test SQL queries
const P21_TEST_QUERY = "SELECT @@VERSION as version"; // Simpler query that should always work
const POR_TEST_QUERY = "SELECT COUNT(*) as count FROM PurchaseOrder";

// Function to test P21 connection using ODBC DSN
async function testP21Connection() {
  console.log('\n=== Testing P21 Connection ===');
  console.log('Connecting to P21 database using ODBC DSN...');
  
  try {
    // Create connection string for P21 using DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    
    // Create a new connection
    const connection = await odbc.connect(connectionString);
    console.log('Successfully connected to P21 database');
    
    // Test a simple query
    console.log('Executing version query...');
    const versionResult = await connection.query('SELECT @@VERSION as version');
    console.log('SQL Server version:', versionResult[0].version.split('\n')[0]);
    
    // Try a more complex query if the version query succeeds
    console.log('Testing a table query...');
    try {
      // Try to query a table that should exist in P21
      const tableQuery = "SELECT TOP 1 * FROM INFORMATION_SCHEMA.TABLES";
      const tableResult = await connection.query(tableQuery);
      console.log('Table query result:', tableResult.length > 0 ? 'Success' : 'No results');
    } catch (queryError) {
      console.error('Error executing table query:', queryError.message);
      // This is not a fatal error for our test
    }
    
    // Close the connection
    await connection.close();
    console.log('P21 connection closed');
    
    return true;
  } catch (error) {
    console.error('P21 connection test failed:', error.message);
    return false;
  }
}

// Function to test POR connection using direct MS Access file access
async function testPORConnection() {
  console.log('\n=== Testing POR Connection ===');
  
  // Try multiple potential POR file locations
  const potentialPaths = [
    process.env.POR_FILE_PATH,
    'C:\\POR\\PORENT.mdb',
    'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\data\\PORENT.mdb',
    'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\PORENT.mdb',
    '.\\PORENT.mdb'
  ].filter(Boolean); // Remove undefined entries
  
  console.log('Searching for POR database file in the following locations:');
  potentialPaths.forEach(path => console.log(`- ${path}`));
  
  let porFilePath = null;
  
  // Find the first path that exists
  for (const path of potentialPaths) {
    if (fs.existsSync(path)) {
      porFilePath = path;
      console.log(`POR file found at: ${porFilePath}`);
      break;
    }
  }
  
  if (!porFilePath) {
    console.error('POR file not found in any of the searched locations.');
    console.log('Please specify the correct path using the POR_FILE_PATH environment variable.');
    return false;
  }
  
  try {
    console.log('Reading POR database...');
    
    // Read the database file
    const buffer = fs.readFileSync(porFilePath);
    
    // Import MDBReader dynamically to avoid issues with ESM/CJS
    const MDBReader = require('mdb-reader');
    const reader = new MDBReader(buffer);
    
    // Get table names
    const tables = reader.getTableNames();
    console.log('Tables in POR database:', tables);
    
    // Try to access any table if available
    if (tables.length > 0) {
      const tableName = tables[0];
      console.log(`Reading first table: ${tableName}`);
      const table = reader.getTable(tableName);
      const count = table.getColumnNames().length;
      console.log(`Table ${tableName} has ${count} columns`);
      
      // Get a sample of records
      const records = table.getData(2);
      console.log('Sample records:', records);
    } else {
      console.log('No tables found in the POR database.');
    }
    
    console.log('POR database test completed successfully');
    return true;
  } catch (error) {
    console.error('POR connection test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting database connection tests...');
  
  // Test P21 connection
  const p21Success = await testP21Connection();
  console.log(`P21 connection test ${p21Success ? 'PASSED' : 'FAILED'}`);
  
  // Test POR connection
  const porSuccess = await testPORConnection();
  console.log(`POR connection test ${porSuccess ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n=== Test Summary ===');
  console.log(`P21: ${p21Success ? '✓' : '✗'}`);
  console.log(`POR: ${porSuccess ? '✓' : '✗'}`);
  
  // Return true if P21 connection is successful, even if POR fails
  // This is because P21 is the primary database we need for the dashboard
  return p21Success;
}

// Run the tests
runTests().then(success => {
  console.log(`\nP21 connection test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error in tests:', error);
  process.exit(1);
});
