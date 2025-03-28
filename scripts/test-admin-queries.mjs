// Test script to diagnose issues with admin spreadsheet SQL queries
import odbc from 'odbc';
import fetch from 'node-fetch';

// Mock the fetch function for server-side testing
global.fetch = fetch;

async function getAdminVariables() {
  try {
    // Connect to SQLite to get the admin variables
    console.log('Getting admin variables from database...');
    
    // Since we can't directly import the admin.ts file in an MJS file,
    // we'll use a simple query to get the first few rows from the admin spreadsheet
    const connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    
    // First, let's check what tables are available
    console.log('\nChecking available tables in P21...');
    const tableResult = await connection.query("SELECT TOP 20 name FROM sys.tables WHERE name LIKE '%order%' OR name LIKE '%inv%' OR name LIKE '%po%' OR name LIKE '%customer%'");
    
    console.log('Available tables:');
    tableResult.forEach(row => {
      console.log(`- ${row.name}`);
    });
    
    // Create some sample admin variables for testing
    const adminVariables = [
      {
        id: '1',
        name: 'Total Orders',
        value: '0',
        category: 'Metrics',
        chartGroup: 'Dashboard',
        chartName: 'Orders',
        variableName: 'orders',
        server: 'P21',
        serverName: 'P21',
        sqlExpression: 'SELECT COUNT(*) FROM order_header',
        tableName: 'order_header'
      },
      {
        id: '2',
        name: 'Average Order Value',
        value: '0',
        category: 'Metrics',
        chartGroup: 'Dashboard',
        chartName: 'Orders',
        variableName: 'avg_order',
        server: 'P21',
        serverName: 'P21',
        sqlExpression: 'SELECT AVG(order_amt) FROM order_header',
        tableName: 'order_header'
      },
      {
        id: '3',
        name: 'Inventory Count',
        value: '0',
        category: 'Metrics',
        chartGroup: 'Dashboard',
        chartName: 'Inventory',
        variableName: 'inv_count',
        server: 'P21',
        serverName: 'P21',
        sqlExpression: 'SELECT COUNT(*) FROM inv_mast',
        tableName: 'inv_mast'
      }
    ];
    
    // For each table we found, create a test query
    tableResult.forEach((table, index) => {
      adminVariables.push({
        id: `auto_${index + 4}`,
        name: `Test ${table.name}`,
        value: '0',
        category: 'Auto',
        chartGroup: 'Auto',
        chartName: 'Auto',
        variableName: `auto_${table.name}`,
        server: 'P21',
        serverName: 'P21',
        sqlExpression: `SELECT COUNT(*) FROM ${table.name}`,
        tableName: table.name
      });
    });
    
    await connection.close();
    
    return adminVariables;
  } catch (error) {
    console.error('Error getting admin variables:', error);
    return [];
  }
}

async function executeP21Query(sqlExpression) {
  try {
    console.log(`Executing P21 query: ${sqlExpression}`);
    
    // Connect directly to P21 using ODBC
    const connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    
    try {
      // Execute the query
      const result = await connection.query(sqlExpression);
      
      // Get the first value from the result
      let value = '0';
      if (result && result.length > 0) {
        const firstRow = result[0];
        if (firstRow) {
          const firstValue = Object.values(firstRow)[0];
          value = firstValue?.toString() || '0';
        }
      }
      
      console.log(`Query result: ${value}`);
      await connection.close();
      return value;
    } catch (queryError) {
      console.error('Error executing query:', queryError);
      await connection.close();
      return '0';
    }
  } catch (error) {
    console.error('Error connecting to P21:', error);
    return '0';
  }
}

async function testAdminQueries() {
  try {
    console.log('Starting admin query tests...');
    
    // Get admin variables
    const adminVariables = await getAdminVariables();
    console.log(`Found ${adminVariables.length} admin variables for testing`);
    
    // Test each admin variable
    for (const variable of adminVariables) {
      console.log(`\n--- Testing variable: ${variable.name} (ID: ${variable.id}) ---`);
      console.log(`SQL: ${variable.sqlExpression}`);
      console.log(`Server: ${variable.server || variable.serverName}`);
      
      // Try to execute the query
      const result = await executeP21Query(variable.sqlExpression);
      
      // Update the variable with the result
      variable.value = result;
      
      console.log(`Result: ${result}`);
    }
    
    // Print a summary of the results
    console.log('\n--- Test Results Summary ---');
    adminVariables.forEach(variable => {
      console.log(`${variable.name}: ${variable.value}`);
    });
    
    console.log('\nAll tests completed');
  } catch (error) {
    console.error('Error during admin query tests:', error);
  }
}

// Run the tests
testAdminQueries().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
