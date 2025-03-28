// Test script to verify the executeQuery method in ConnectionManager
// This script tests both P21 and POR database queries

// Import required modules
const path = require('path');
const fs = require('fs');

// We need to use dynamic import for TypeScript modules
async function importConnectionManager() {
  try {
    // First, compile the TypeScript files to JavaScript
    console.log('Compiling TypeScript files...');
    require('child_process').execSync('npx tsc', { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit'
    });
    
    // Then import the compiled JavaScript module
    console.log('Importing ConnectionManager...');
    const { ConnectionManager } = require('../dist/lib/db/connection-manager');
    return ConnectionManager;
  } catch (error) {
    console.error('Failed to import ConnectionManager:', error.message);
    throw error;
  }
}

// Test queries
const P21_VERSION_QUERY = "SELECT @@VERSION as version";
const P21_TABLES_QUERY = "SELECT TOP 5 TABLE_NAME FROM INFORMATION_SCHEMA.TABLES";
const POR_TABLES_QUERY = "SELECT TOP 5 * FROM MSysObjects";

// Function to test executeQuery with P21
async function testP21Query(ConnectionManager) {
  console.log('\n=== Testing P21 Query Execution ===');
  
  try {
    // Execute a simple version query
    console.log('Executing P21 version query...');
    const versionResult = await ConnectionManager.executeQuery('P21', P21_VERSION_QUERY);
    console.log('SQL Server version:', versionResult[0].version.split('\n')[0]);
    
    // Execute a query to get table names
    console.log('\nExecuting P21 tables query...');
    const tablesResult = await ConnectionManager.executeQuery('P21', P21_TABLES_QUERY);
    console.log('Tables in P21 database:');
    tablesResult.forEach((row, index) => {
      console.log(`${index + 1}. ${row.TABLE_NAME}`);
    });
    
    console.log('P21 query execution test completed successfully');
    return true;
  } catch (error) {
    console.error('P21 query execution test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Function to test executeQuery with POR
async function testPORQuery(ConnectionManager) {
  console.log('\n=== Testing POR Query Execution ===');
  
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
    // Execute a query to get table information
    console.log('\nExecuting POR tables query...');
    const result = await ConnectionManager.executeQuery('POR', POR_TABLES_QUERY, { porFilePath });
    
    console.log(`Query returned ${result.length} rows`);
    if (result.length > 0) {
      console.log('First row:', result[0]);
    }
    
    console.log('POR query execution test completed successfully');
    return true;
  } catch (error) {
    console.error('POR query execution test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  console.log('Starting query execution tests...');
  
  try {
    // Import the ConnectionManager
    const ConnectionManager = await importConnectionManager();
    
    // Test P21 query execution
    const p21Success = await testP21Query(ConnectionManager);
    console.log(`P21 query execution test ${p21Success ? 'PASSED' : 'FAILED'}`);
    
    // Test POR query execution
    const porSuccess = await testPORQuery(ConnectionManager);
    console.log(`POR query execution test ${porSuccess ? 'PASSED' : 'FAILED'}`);
    
    console.log('\n=== Test Summary ===');
    console.log(`P21: ${p21Success ? '✓' : '✗'}`);
    console.log(`POR: ${porSuccess ? '✓' : '✗'}`);
    
    // Return true if P21 connection is successful, even if POR fails
    // This is because P21 is the primary database we need for the dashboard
    return p21Success;
  } catch (error) {
    console.error('Failed to run tests:', error.message);
    return false;
  }
}

// Run the tests
runTests().then(success => {
  console.log(`\nP21 query execution test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled error in tests:', error);
  process.exit(1);
});
