// Script to test specific SQL expressions from the dashboard
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Sample SQL expressions to test
const TEST_EXPRESSIONS = [
  {
    name: 'P21 Simple Count',
    server: 'P21',
    sql: 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)'
  },
  {
    name: 'P21 Date Filter',
    server: 'P21',
    sql: 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -30, GETDATE())'
  },
  {
    name: 'POR Simple Count',
    server: 'POR',
    sql: 'SELECT Count(*) as value FROM Rentals'
  },
  {
    name: 'POR Date Filter',
    server: 'POR',
    sql: 'SELECT Count(*) as value FROM Rentals WHERE CreatedDate >= DateAdd("d", -30, Date())'
  }
];

// Function to test a SQL expression
async function testSqlExpression(name, server, sql) {
  console.log(`\nTesting ${name} (${server}):`);
  console.log(`SQL: ${sql}`);
  
  try {
    const requestBody = {
      query: sql,
      server: server
    };
    
    // Add filePath for POR queries
    if (server === 'POR') {
      requestBody.filePath = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';
    }
    
    const response = await fetch(`${BASE_URL}/api/executeQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      console.log(`❌ Query failed: Server responded with status ${response.status}`);
      try {
        const errorText = await response.text();
        console.log(`Response text: ${errorText}`);
      } catch (textError) {
        console.log(`Error getting response text: ${textError.message}`);
      }
      return false;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.log(`❌ Query failed: ${result.message || 'Unknown error'}`);
      return false;
    }
    
    console.log(`✅ Query successful`);
    if (result.data && result.data.length > 0) {
      console.log(`Result: ${JSON.stringify(result.data[0])}`);
      return true;
    } else {
      console.log(`No data returned`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error executing query: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('Testing specific SQL expressions...');
  
  // Check if the server is running
  console.log('\nChecking if server is running...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      console.log('❌ Server is not running. Please start the server with "npm run dev" and try again.');
      return;
    }
    console.log('✅ Server is running.');
  } catch (error) {
    console.log(`❌ Error checking server status: ${error.message}`);
    console.log('Please make sure the server is running with "npm run dev" and try again.');
    return;
  }
  
  // Test each SQL expression
  let successCount = 0;
  let failureCount = 0;
  
  for (const expr of TEST_EXPRESSIONS) {
    const success = await testSqlExpression(expr.name, expr.server, expr.sql);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  // Summary
  console.log(`\nSummary: ${successCount} queries succeeded, ${failureCount} queries failed.`);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error in main function:', error);
});
