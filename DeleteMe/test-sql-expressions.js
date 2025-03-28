// Script to test SQL expressions against P21 and POR databases
const { ConnectionManager } = require('../lib/db/connection-manager');
const path = require('path');
const fs = require('fs');

// Default POR file path
const DEFAULT_POR_FILE_PATH = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\data\\por.mdb';

// Test P21 SQL expression
async function testP21Expression(sqlExpression) {
  try {
    console.log(`Testing P21 SQL expression: ${sqlExpression}`);
    
    // P21 configuration
    const p21Config = {
      server: 'P21',
      dsn: 'P21',
      database: 'P21',
      useWindowsAuth: true
    };
    
    // Execute the query
    const result = await ConnectionManager.executeSqlServerQuery(p21Config, sqlExpression);
    console.log('P21 Result:', result);
    return result;
  } catch (error) {
    console.error('P21 Query Error:', error.message);
    return null;
  }
}

// Test POR SQL expression
async function testPORExpression(sqlExpression) {
  try {
    console.log(`Testing POR SQL expression: ${sqlExpression}`);
    
    // Check if POR file exists
    if (!fs.existsSync(DEFAULT_POR_FILE_PATH)) {
      console.error(`POR file not found at: ${DEFAULT_POR_FILE_PATH}`);
      return null;
    }
    
    // POR configuration
    const porConfig = {
      filePath: DEFAULT_POR_FILE_PATH
    };
    
    // Execute the query
    const result = await ConnectionManager.executeAccessQuery(porConfig, sqlExpression);
    console.log('POR Result:', result);
    return result;
  } catch (error) {
    console.error('POR Query Error:', error.message);
    return null;
  }
}

// List all tables in POR database
async function listPORTables() {
  try {
    console.log('Listing all tables in POR database');
    
    // POR configuration
    const porConfig = {
      filePath: DEFAULT_POR_FILE_PATH
    };
    
    // Execute the query to show tables
    const result = await ConnectionManager.executeAccessQuery(porConfig, 'SHOW TABLES');
    console.log('POR Tables:', result);
    return result;
  } catch (error) {
    console.error('Error listing POR tables:', error.message);
    return null;
  }
}

// Main function to run tests
async function runTests() {
  console.log('Starting SQL expression tests...');
  
  // First, list all tables in POR database
  await listPORTables();
  
  // Test P21 SQL expressions
  const p21TestExpressions = [
    // Simple count query to test connection
    'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)',
    
    // Test query for AR Aging
    'SELECT COUNT(*) as value FROM dbo.ar_open WITH (NOLOCK) WHERE inv_date >= DATEADD(day, -30, GETDATE())'
  ];
  
  // Test POR SQL expressions
  const porTestExpressions = [
    // Simple count query to test connection
    'SELECT Count(*) as value FROM Rentals',
    
    // Test query for new rentals in current month
    'SELECT Count(*) as value FROM Rentals WHERE Status = "New" AND Month(CreatedDate) = Month(Date()) AND Year(CreatedDate) = Year(Date())'
  ];
  
  // Run P21 tests
  console.log('\n--- P21 SQL Tests ---');
  for (const expr of p21TestExpressions) {
    await testP21Expression(expr);
  }
  
  // Run POR tests
  console.log('\n--- POR SQL Tests ---');
  for (const expr of porTestExpressions) {
    await testPORExpression(expr);
  }
  
  console.log('\nAll tests completed.');
}

// Run the tests
runTests().catch(err => {
  console.error('Test script error:', err);
});
