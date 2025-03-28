// POR SQL Server Connection Test Script
// This script tests connection to the POR database on TS03

// Import required modules
const mssql = require('mssql');
const dns = require('dns').promises;
const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Default connection configuration for POR
const porConfig = {
  server: 'TS03',
  database: 'POR',
  port: 1433,
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
    connectTimeout: 15000,
    integrated: true,
    trustedConnection: true
  }
};

// Get command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') porConfig.server = value;
  if (key === 'database') porConfig.database = value;
  if (key === 'port') porConfig.port = parseInt(value, 10);
}

// Function to get current Windows username
async function getCurrentWindowsUser() {
  try {
    const { stdout } = await execPromise('whoami');
    return stdout.trim();
  } catch (error) {
    console.error(`Error getting current user: ${error.message}`);
    return null;
  }
}

// Function to check network connectivity
async function checkNetworkConnectivity(server, port = 1433) {
  console.log(`\n=== Network Connectivity Check for ${server}:${port} ===`);
  
  try {
    // DNS resolution
    console.log(`Performing DNS lookup for ${server}...`);
    const addresses = await dns.lookup(server, { all: true });
    
    if (addresses && addresses.length > 0) {
      console.log('DNS resolution successful:');
      addresses.forEach(addr => {
        console.log(`- ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`);
      });
      
      // TCP connectivity check
      const ipAddress = addresses[0].address;
      
      console.log(`\nTesting TCP connectivity to ${ipAddress}:${port}...`);
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        let connected = false;
        
        socket.setTimeout(5000);
        
        socket.on('connect', () => {
          console.log(`Successfully connected to ${ipAddress}:${port}`);
          connected = true;
          socket.end();
          resolve(true);
        });
        
        socket.on('timeout', () => {
          console.error(`Connection to ${ipAddress}:${port} timed out`);
          socket.destroy();
          resolve(false);
        });
        
        socket.on('error', (err) => {
          console.error(`Error connecting to ${ipAddress}:${port}: ${err.message}`);
          resolve(false);
        });
        
        socket.on('close', () => {
          if (!connected) {
            console.error(`Failed to connect to ${ipAddress}:${port}`);
            resolve(false);
          }
        });
        
        socket.connect(port, ipAddress);
      });
    } else {
      console.error(`DNS resolution failed for ${server}`);
      return false;
    }
  } catch (error) {
    console.error(`Network check error: ${error.message}`);
    return false;
  }
}

// Function to ping the server
async function pingServer(server) {
  console.log(`\nPinging ${server}...`);
  
  try {
    const { stdout } = await execPromise(`ping -n 4 ${server}`);
    console.log(stdout);
    return true;
  } catch (error) {
    console.error(`Ping error: ${error.message}`);
    return false;
  }
}

// Test Windows Authentication
async function testWindowsAuth(config) {
  console.log('\n=== Testing Windows Authentication ===');
  
  // Get current Windows user
  const currentUser = await getCurrentWindowsUser();
  console.log(`Current Windows user: ${currentUser}`);
  
  console.log('Connection details:');
  console.log(JSON.stringify(config, null, 2));
  
  try {
    console.log('Attempting to connect with Windows Authentication...');
    const pool = new mssql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Windows Authentication successful!');
    
    // Try a simple query
    try {
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log('✅ Query successful');
      console.log('SQL Server version:');
      console.log(result.recordset[0].version);
      
      // Try a simple query to verify database access
      try {
        // First check if we can access the database
        await pool.request().query(`USE [${config.database}]`);
        console.log(`✅ Successfully connected to '${config.database}' database`);
        
        // Try to list some tables
        const tablesResult = await pool.request().query(`
          SELECT TOP 10 name FROM sys.tables ORDER BY name
        `);
        
        if (tablesResult.recordset && tablesResult.recordset.length > 0) {
          console.log('\nSome tables in the database:');
          tablesResult.recordset.forEach(table => {
            console.log(`- ${table.name}`);
          });
          
          // Try a sample query - adjust this based on actual table names
          if (tablesResult.recordset.length > 0) {
            const sampleTable = tablesResult.recordset[0].name;
            console.log(`\nExecuting sample query on table '${sampleTable}'...`);
            
            try {
              const sampleResult = await pool.request().query(`
                SELECT TOP 5 * FROM [${sampleTable}]
              `);
              
              if (sampleResult.recordset && sampleResult.recordset.length > 0) {
                console.log(`✅ Sample query successful! Found ${sampleResult.recordset.length} rows`);
              } else {
                console.log('⚠️ Sample query returned no results');
              }
            } catch (sampleError) {
              console.error(`❌ Sample query failed: ${sampleError.message}`);
            }
          }
        } else {
          console.log('⚠️ No tables found in the database');
        }
      } catch (dbError) {
        console.error(`❌ Database access error: ${dbError.message}`);
      }
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
    }
    
    // Close the connection
    await pool.close();
    
    return true;
  } catch (error) {
    console.error(`❌ Windows Authentication failed: ${error.message}`);
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.originalError) {
      console.error('Original error details:');
      console.error(error.originalError.message || error.originalError);
    }
    
    return false;
  }
}

// Try alternative server names
async function tryAlternativeServerNames() {
  console.log('\n=== Trying Alternative Server Names ===');
  
  const alternativeServers = [
    porConfig.server,
    `${porConfig.server}.tallman.com`,
    '10.10.20.13', // Direct IP address
    'localhost'
  ];
  
  console.log('Trying the following server names:');
  alternativeServers.forEach(server => console.log(`- ${server}`));
  
  for (const server of alternativeServers) {
    console.log(`\n=== Testing server: ${server} ===`);
    
    // Check network connectivity first
    const isReachable = await checkNetworkConnectivity(server, porConfig.port);
    
    if (!isReachable) {
      console.log(`Skipping ${server} due to network connectivity issues`);
      continue;
    }
    
    // Try Windows Authentication
    const winConfig = {
      ...porConfig,
      server
    };
    
    const winAuthSuccess = await testWindowsAuth(winConfig);
    
    if (winAuthSuccess) {
      return { server, config: winConfig };
    }
  }
  
  return null;
}

// Main function
async function main() {
  try {
    console.log('=== POR SQL Server Connection Test ===');
    console.log(`Server: ${porConfig.server}`);
    console.log(`Database: ${porConfig.database}`);
    console.log(`Port: ${porConfig.port}`);
    console.log('Authentication: Windows Authentication');
    
    // Check network connectivity
    const isReachable = await checkNetworkConnectivity(porConfig.server, porConfig.port);
    
    if (!isReachable) {
      console.error(`\n❌ Server ${porConfig.server} is not reachable`);
      console.log('Trying ping test...');
      
      await pingServer(porConfig.server);
      
      console.log('\nTrying alternative server names...');
      
      const connectionInfo = await tryAlternativeServerNames();
      
      if (connectionInfo) {
        console.log(`\n✅ Found working server: ${connectionInfo.server}`);
        console.log(`Use this server name in your connection configuration.`);
      } else {
        console.error('\n❌ Could not connect to any server');
        console.log('\nRecommendations:');
        console.log('1. Verify SQL Server is running and accepting connections');
        console.log('2. Check network connectivity and firewall settings');
        console.log('3. Ensure your Windows account has access to the SQL Server');
      }
    } else {
      // Test Windows Authentication
      const winAuthSuccess = await testWindowsAuth(porConfig);
      
      if (!winAuthSuccess) {
        console.log('\nTrying alternative server names...');
        
        const connectionInfo = await tryAlternativeServerNames();
        
        if (connectionInfo) {
          console.log(`\n✅ Found working server: ${connectionInfo.server}`);
          console.log(`Use this server name in your connection configuration.`);
        } else {
          console.error('\n❌ Windows Authentication failed for all server names');
          console.log('\nRecommendations:');
          console.log('1. Verify SQL Server is running and accepting connections');
          console.log('2. Ensure SQL Server is configured to allow Windows Authentication');
          console.log('3. Check if your Windows account has access to the SQL Server');
          console.log('4. Consult with database administrator for assistance');
        }
      }
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
