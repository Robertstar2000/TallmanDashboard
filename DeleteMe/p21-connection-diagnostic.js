// P21 SQL Server Connection Diagnostic Tool
// This script performs comprehensive diagnostics on P21 SQL Server connection

// Import required modules
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const dns = require('dns');
const net = require('net');

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
  password: process.env.P21_PASSWORD || '',
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

// Function to perform network diagnostics
async function performNetworkDiagnostics(server, port) {
  console.log('\n=== Network Diagnostics ===');
  
  // Check if server is an IP address or hostname
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(server);
  
  if (!isIp) {
    // DNS lookup
    console.log(`\nPerforming DNS lookup for ${server}...`);
    try {
      const addresses = await new Promise((resolve, reject) => {
        dns.lookup(server, { all: true }, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      
      if (addresses && addresses.length > 0) {
        console.log('DNS resolution successful:');
        addresses.forEach(addr => {
          console.log(`- ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`);
        });
        
        // Use the first IP address for further tests
        const ip = addresses[0].address;
        
        // Test TCP port connectivity
        console.log(`\nTesting TCP connectivity to ${ip}:${port}...`);
        try {
          await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            
            // Set timeout to 5 seconds
            socket.setTimeout(5000);
            
            socket.on('connect', () => {
              console.log(`Successfully connected to ${ip}:${port}`);
              socket.end();
              resolve();
            });
            
            socket.on('timeout', () => {
              socket.destroy();
              reject(new Error('Connection timeout'));
            });
            
            socket.on('error', (err) => {
              reject(err);
            });
            
            socket.connect(port, ip);
          });
        } catch (error) {
          console.error(`Failed to connect to ${ip}:${port}: ${error.message}`);
          console.log('\nPossible causes:');
          console.log('- SQL Server is not running');
          console.log('- Firewall is blocking the connection');
          console.log('- SQL Server is not configured to accept TCP/IP connections');
          console.log('- SQL Server is not listening on the specified port');
        }
      } else {
        console.log(`Could not resolve hostname ${server}`);
      }
    } catch (error) {
      console.error(`DNS lookup failed: ${error.message}`);
    }
  } else {
    // If it's already an IP address, skip DNS lookup
    console.log(`Server is specified as IP address: ${server}`);
    
    // Test TCP port connectivity
    console.log(`\nTesting TCP connectivity to ${server}:${port}...`);
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        
        // Set timeout to 5 seconds
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          console.log(`Successfully connected to ${server}:${port}`);
          socket.end();
          resolve();
        });
        
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('Connection timeout'));
        });
        
        socket.on('error', (err) => {
          reject(err);
        });
        
        socket.connect(port, server);
      });
    } catch (error) {
      console.error(`Failed to connect to ${server}:${port}: ${error.message}`);
      console.log('\nPossible causes:');
      console.log('- SQL Server is not running');
      console.log('- Firewall is blocking the connection');
      console.log('- SQL Server is not configured to accept TCP/IP connections');
      console.log('- SQL Server is not listening on the specified port');
    }
  }
  
  // Ping test
  console.log(`\nPinging ${server}...`);
  try {
    await new Promise((resolve, reject) => {
      const pingCmd = process.platform === 'win32' ? 
        `ping -n 4 ${server}` : 
        `ping -c 4 ${server}`;
      
      exec(pingCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Ping failed: ${stderr || error.message}`);
          reject(error);
        } else {
          console.log(stdout);
          resolve();
        }
      });
    });
  } catch (error) {
    // Ping failure is already logged in the promise
  }
}

// Function to test SQL Server connection with SQL authentication
async function testSqlAuth() {
  console.log('\n=== Testing SQL Server Authentication ===');
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.user}`);
  console.log(`Port: ${config.port}`);
  
  try {
    console.log('\nAttempting to connect with SQL authentication...');
    
    // Create a connection pool
    const pool = new mssql.ConnectionPool({
      server: config.server,
      database: config.database,
      user: config.user,
      password: config.password,
      port: config.port,
      options: config.options
    });
    
    // Connect to the database
    await pool.connect();
    console.log('Connected successfully with SQL authentication!');
    
    // Execute the query
    console.log('\nExecuting SQL query...');
    console.log(PRODUCTION_SQL);
    
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
    
    return true;
  } catch (error) {
    console.error('\nERROR connecting with SQL authentication:');
    console.error(error.message);
    
    // Additional error details
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.originalError) {
      console.error('Original error details:');
      console.error(error.originalError);
    }
    
    return false;
  }
}

// Function to test SQL Server connection with Windows authentication
async function testWindowsAuth() {
  console.log('\n=== Testing Windows Authentication ===');
  console.log(`Server: ${config.server}`);
  console.log(`Database: ${config.database}`);
  console.log(`Port: ${config.port}`);
  
  try {
    console.log('\nAttempting to connect with Windows authentication...');
    
    // Create a connection pool
    const pool = new mssql.ConnectionPool({
      server: config.server,
      database: config.database,
      port: config.port,
      options: {
        ...config.options,
        trustedConnection: true
      }
    });
    
    // Connect to the database
    await pool.connect();
    console.log('Connected successfully with Windows authentication!');
    
    // Execute the query
    console.log('\nExecuting SQL query...');
    console.log(PRODUCTION_SQL);
    
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
    
    return true;
  } catch (error) {
    console.error('\nERROR connecting with Windows authentication:');
    console.error(error.message);
    
    // Additional error details
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.originalError) {
      console.error('Original error details:');
      console.error(error.originalError);
    }
    
    return false;
  }
}

// Function to check SQL Server configuration
async function checkSqlServerConfig() {
  console.log('\n=== SQL Server Configuration Check ===');
  
  // Create a basic connection to check server configuration
  try {
    console.log('\nAttempting to connect to master database...');
    
    // Try to connect to master database
    const pool = new mssql.ConnectionPool({
      server: config.server,
      database: 'master',
      user: config.user,
      password: config.password,
      port: config.port,
      options: config.options
    });
    
    await pool.connect();
    console.log('Connected to master database successfully!');
    
    // Check if the target database exists
    console.log(`\nChecking if database '${config.database}' exists...`);
    const dbResult = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = '${config.database}'
    `);
    
    if (dbResult.recordset && dbResult.recordset.length > 0) {
      console.log(`Database '${config.database}' exists`);
    } else {
      console.error(`Database '${config.database}' does not exist!`);
      console.log('Available databases:');
      
      const allDbResult = await pool.request().query(`
        SELECT name FROM sys.databases ORDER BY name
      `);
      
      if (allDbResult.recordset) {
        allDbResult.recordset.forEach(db => {
          console.log(`- ${db.name}`);
        });
      }
    }
    
    // Check authentication mode
    console.log('\nChecking SQL Server authentication mode...');
    const authResult = await pool.request().query(`
      SELECT SERVERPROPERTY('IsIntegratedSecurityOnly') as is_windows_only
    `);
    
    if (authResult.recordset && authResult.recordset.length > 0) {
      const isWindowsOnly = authResult.recordset[0].is_windows_only === 1;
      
      if (isWindowsOnly) {
        console.log('SQL Server is configured for Windows Authentication only');
        console.log('SQL Authentication (username/password) is disabled');
      } else {
        console.log('SQL Server is configured for Mixed Mode Authentication');
        console.log('Both Windows Authentication and SQL Authentication are enabled');
      }
    }
    
    // Check if the P21 database has the expected tables
    if (dbResult.recordset && dbResult.recordset.length > 0) {
      console.log(`\nChecking if 'oe_hdr' table exists in ${config.database}...`);
      
      try {
        // Switch to the target database
        await pool.request().query(`USE [${config.database}]`);
        
        const tableResult = await pool.request().query(`
          SELECT OBJECT_ID('dbo.oe_hdr') as table_id
        `);
        
        if (tableResult.recordset && tableResult.recordset.length > 0 && tableResult.recordset[0].table_id) {
          console.log("Table 'oe_hdr' exists in the database");
        } else {
          console.error("Table 'oe_hdr' does not exist in the database!");
          
          // List some tables to help identify the correct table name
          console.log('\nSome tables in the database:');
          const tablesResult = await pool.request().query(`
            SELECT TOP 10 name FROM sys.tables ORDER BY name
          `);
          
          if (tablesResult.recordset) {
            tablesResult.recordset.forEach(table => {
              console.log(`- ${table.name}`);
            });
          }
        }
      } catch (error) {
        console.error(`Error checking for oe_hdr table: ${error.message}`);
      }
    }
    
    // Close the connection
    await pool.close();
    
  } catch (error) {
    console.error('\nERROR checking SQL Server configuration:');
    console.error(error.message);
  }
}

// Main function
async function main() {
  console.log('=== P21 SQL Server Connection Diagnostic Tool ===');
  
  try {
    // Step 1: Network diagnostics
    await performNetworkDiagnostics(config.server, config.port);
    
    // Step 2: Test SQL authentication if credentials are provided
    let sqlAuthSuccess = false;
    if (config.user && config.password) {
      sqlAuthSuccess = await testSqlAuth();
    } else {
      console.log('\nSkipping SQL authentication test (no credentials provided)');
    }
    
    // Step 3: Test Windows authentication if SQL auth failed or no credentials
    let windowsAuthSuccess = false;
    if (!sqlAuthSuccess) {
      windowsAuthSuccess = await testWindowsAuth();
    }
    
    // Step 4: Check SQL Server configuration if we can connect
    if (sqlAuthSuccess || windowsAuthSuccess) {
      await checkSqlServerConfig();
    }
    
    console.log('\n=== Diagnostic Summary ===');
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`SQL Authentication: ${sqlAuthSuccess ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Windows Authentication: ${windowsAuthSuccess ? 'SUCCESS' : 'FAILED'}`);
    
    if (!sqlAuthSuccess && !windowsAuthSuccess) {
      console.log('\nTROUBLESHOOTING RECOMMENDATIONS:');
      console.log('1. Verify SQL Server is running and accepting connections');
      console.log('2. Check if the server name/IP address is correct');
      console.log('3. Ensure SQL Server is configured for Mixed Mode Authentication');
      console.log('4. Verify the SQL login credentials are correct');
      console.log('5. Check if the login has access to the specified database');
      console.log('6. Ensure firewall rules allow connections to SQL Server port');
    }
    
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
