// Script to test SQL error handling with the correct P21 connection settings
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// P21 connection details based on provided information
const P21_CONNECTION = {
  server: 'SQL01',
  port: 1433,
  database: 'P21play',
  user: 'SA',
  password: '', // Password should be entered at runtime or stored securely
  // Removing domain as we're using SQL authentication
  options: {
    trustServerCertificate: true,
    encrypt: false
  }
};

// Test queries - including valid and invalid ones to test error handling
const TEST_QUERIES = [
  {
    name: 'Valid Query - Count Users',
    sql: 'SELECT COUNT(*) AS count FROM sysobjects WHERE type = \'U\'',
    shouldSucceed: true
  },
  {
    name: 'Invalid Syntax Query',
    sql: 'SELECT * FROMM sysobjects', // Intentional syntax error
    shouldSucceed: false
  },
  {
    name: 'Non-existent Table Query',
    sql: 'SELECT * FROM table_that_does_not_exist',
    shouldSucceed: false
  },
  {
    name: 'Invalid Column Query',
    sql: 'SELECT nonexistent_column FROM sysobjects',
    shouldSucceed: false
  }
];

// Test SQL error handling
async function testSqlErrorHandling() {
  console.log('=== Testing SQL Error Handling with P21 Connection ===');
  console.log(`Server: ${P21_CONNECTION.server}:${P21_CONNECTION.port}`);
  console.log(`Database: ${P21_CONNECTION.database}`);
  console.log(`User: ${P21_CONNECTION.user}`);
  console.log('');

  try {
    // Try to load mssql module
    const sql = require('mssql');
    
    // Configure connection
    const sqlConfig = {
      user: P21_CONNECTION.user,
      password: P21_CONNECTION.password,
      database: P21_CONNECTION.database,
      server: P21_CONNECTION.server,
      port: P21_CONNECTION.port,
      options: P21_CONNECTION.options
    };
    
    console.log('Attempting to connect to P21 database...');
    
    // Connect to the database
    let pool;
    try {
      pool = await sql.connect(sqlConfig);
      console.log('Successfully connected to P21 database');
    } catch (connectionError) {
      console.error('Connection Error:', connectionError.message);
      process.exit(1);
    }
    
    // Run each test query
    for (const test of TEST_QUERIES) {
      console.log(`\n--- Testing: ${test.name} ---`);
      console.log(`SQL: ${test.sql}`);
      
      try {
        const result = await pool.request().query(test.sql);
        console.log('Query succeeded:', result.recordset);
        
        if (!test.shouldSucceed) {
          console.log('WARNING: Query was expected to fail but succeeded');
        }
      } catch (queryError) {
        console.log('Query failed:', queryError.message);
        
        // Simulate our error handling logic
        const errorType = getErrorType(queryError);
        console.log('Error Type:', errorType);
        console.log('Returning zero value due to error');
        
        if (test.shouldSucceed) {
          console.log('WARNING: Query was expected to succeed but failed');
        }
      }
    }
    
    // Close the connection
    await sql.close();
    console.log('\nConnection closed');
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

// Determine error type based on error message
function getErrorType(error) {
  const message = error.message.toLowerCase();
  
  if (message.includes('login failed') || 
      message.includes('connect') || 
      message.includes('network') || 
      message.includes('timeout')) {
    return 'connection';
  } else if (message.includes('syntax') || 
             message.includes('incorrect syntax')) {
    return 'syntax';
  } else if (message.includes('permission') || 
             message.includes('access denied')) {
    return 'permission';
  } else if (message.includes('invalid') || 
             message.includes('not found') || 
             message.includes('does not exist')) {
    return 'execution';
  } else {
    return 'other';
  }
}

// Main function
async function main() {
  try {
    await testSqlErrorHandling();
  } catch (error) {
    console.error('Error in main function:', error.message);
  }
}

// Run the main function
main();
