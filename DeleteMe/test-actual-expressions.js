// Script to test actual SQL expressions from complete-chart-data.ts
const { ConnectionManager } = require('../lib/db/connection-manager.ts');
const path = require('path');
const fs = require('fs');

// Default POR file path
const DEFAULT_POR_FILE_PATH = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\CascadeProjects\\TallmanDashboard_new\\data\\por.mdb';

// Test P21 SQL expression
async function testP21Expression(sqlExpression, description) {
  try {
    console.log(`\nTesting P21 SQL expression: ${description}`);
    console.log(`SQL: ${sqlExpression}`);
    
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
async function testPORExpression(sqlExpression, description) {
  try {
    console.log(`\nTesting POR SQL expression: ${description}`);
    console.log(`SQL: ${sqlExpression}`);
    
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
    console.log('\nListing all tables in POR database');
    
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
  
  // First, list all tables in POR database to verify connection
  await listPORTables();
  
  // Test P21 SQL expressions from complete-chart-data.ts
  const p21TestExpressions = [
    // Simple count query to test connection
    {
      sql: 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)',
      description: 'Basic connection test - Count orders'
    },
    
    // AR Aging query
    {
      sql: 'SELECT SUM(AR_BALANCE) AS value FROM dbo.ARINV WITH (NOLOCK) WHERE DATEDIFF(DAY, AR_DUE_DATE, GETDATE()) BETWEEN 1 AND 30',
      description: 'AR Aging 1-30 Days'
    },
    
    // Modified version without parameter
    {
      sql: 'SELECT SUM(AR_BALANCE) AS value FROM dbo.ARINV WITH (NOLOCK) WHERE DATEDIFF(DAY, AR_DUE_DATE, GETDATE()) BETWEEN 31 AND 60',
      description: 'AR Aging 31-60 Days'
    }
  ];
  
  // Test POR SQL expressions from complete-chart-data.ts
  const porTestExpressions = [
    // Simple count query to test connection
    {
      sql: 'SELECT Count(*) as value FROM SOMAST',
      description: 'Basic connection test - Count SOMAST records'
    },
    
    // New Rentals query
    {
      sql: 'SELECT Count(*) AS value FROM SOMAST WHERE OrderType = \'Rental\' AND RentalStatus = \'New\' AND Month(SO_DATE) = Month(Date()) AND Year(SO_DATE) = Year(Date())',
      description: 'New Rentals Current Month'
    },
    
    // Web Orders query
    {
      sql: 'SELECT Count(*) AS value FROM Orders WHERE Source = \'Web\' AND Month(OrderDate) = Month(Date()) AND Year(OrderDate) = Year(Date())',
      description: 'Web Orders Current Month'
    }
  ];
  
  // Run P21 tests
  console.log('\n--- P21 SQL Tests ---');
  for (const expr of p21TestExpressions) {
    await testP21Expression(expr.sql, expr.description);
  }
  
  // Run POR tests
  console.log('\n--- POR SQL Tests ---');
  for (const expr of porTestExpressions) {
    await testPORExpression(expr.sql, expr.description);
  }
  
  console.log('\nAll tests completed.');
}

// Run the tests
runTests().catch(err => {
  console.error('Test script error:', err);
});
