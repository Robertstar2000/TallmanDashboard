// Test script to verify live connection to P21 SQL Server
// This script uses the existing codebase connection process and the first row's production SQL expression

// Import required modules
const path = require('path');
const fs = require('fs');

// SQL Server connection - using the mssql package
let mssql;
try {
  mssql = require('mssql');
} catch (err) {
  console.error('mssql package not found. Please install it with: npm install mssql');
  process.exit(1);
}

// Production SQL expression from the first row in initial-data.ts
const PRODUCTION_SQL = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";

// Connection configuration - to be filled from environment variables or command line
const config = {
  server: process.env.P21_SERVER || '',
  database: process.env.P21_DATABASE || 'P21play',
  user: process.env.P21_USER || '',
  password: process.env.P21_PASSWORD || 'Ted@Admin230',
  port: parseInt(process.env.P21_PORT || '1433', 10),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
    connectTimeout: 30000
  }
};

// Get command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') config.server = value;
  if (key === 'database') config.database = value;
  if (key === 'user') config.user = value;
  if (key === 'password') config.password = value;
  if (key === 'port') config.port = parseInt(value, 10);
}

// Validate required configuration
if (!config.server) {
  console.error('Server name is required. Set P21_SERVER environment variable or use --server parameter');
  process.exit(1);
}

if (!config.user) {
  console.error('Username is required. Set P21_USER environment variable or use --user parameter');
  process.exit(1);
}

if (!config.password) {
  console.error('Password is required. Set P21_PASSWORD environment variable or use --password parameter');
  process.exit(1);
}

// Function to test connection and execute query
async function testP21Connection() {
  console.log('=== P21 Live Connection Test ===');
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log(`Port: ${config.port}`);
  console.log('\nSQL to execute:');
  console.log(PRODUCTION_SQL);
  
  try {
    console.log('\nAttempting to connect to P21 database...');
    
    // Create a connection pool
    const pool = new mssql.ConnectionPool(config);
    
    // Connect to the database
    await pool.connect();
    console.log('Connected successfully to P21 database!');
    
    // Execute the query
    console.log('\nExecuting SQL query...');
    const result = await pool.request().query(PRODUCTION_SQL);
    
    // Process the result
    if (result.recordset && result.recordset.length > 0) {
      const firstRow = result.recordset[0];
      const value = firstRow ? Object.values(firstRow)[0] : null;
      
      console.log('\nQuery Result:');
      console.log(`Value: ${value}`);
      
      if (value === null || value === undefined) {
        console.log('WARNING: Query returned null value');
      } else {
        console.log('SUCCESS: Query returned a value');
      }
    } else {
      console.log('\nQuery returned no results');
    }
    
    // Close the connection
    await pool.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('\nERROR connecting to P21 database:');
    console.error(error.message);
    
    // Additional error details
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.originalError) {
      console.error('Original error details:');
      console.error(error.originalError);
    }
    
    // Common error troubleshooting
    if (error.message.includes('getaddrinfo')) {
      console.log('\nTROUBLESHOOTING: Server name resolution failed');
      console.log('- Verify the server name is correct');
      console.log('- Check if the server is accessible from this network');
      console.log('- Try using an IP address instead of hostname');
    }
    
    if (error.message.includes('Login failed')) {
      console.log('\nTROUBLESHOOTING: Authentication failed');
      console.log('- Verify username and password are correct');
      console.log('- Ensure the user has access to the specified database');
    }
    
    if (error.message.includes('timeout')) {
      console.log('\nTROUBLESHOOTING: Connection timeout');
      console.log('- Check if SQL Server is running');
      console.log('- Verify firewall settings allow connections on port 1433');
      console.log('- Check if SQL Server is configured to allow remote connections');
    }
  }
}

// Main function
async function main() {
  try {
    await testP21Connection();
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
