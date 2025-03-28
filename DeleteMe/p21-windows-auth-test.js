// P21 SQL Server Windows Authentication Test Script
// This script tests Windows integrated authentication for SQL Server

// Import required modules
const mssql = require('mssql');
const { exec } = require('child_process');
const dns = require('dns').promises;
const net = require('net');

// Base configuration for Windows Authentication
const winAuthConfig = {
  server: process.env.P21_SERVER || 'SQL01',
  database: process.env.P21_DATABASE || 'P21play',
  port: parseInt(process.env.P21_PORT || '1433', 10),
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
  
  if (key === 'server') winAuthConfig.server = value;
  if (key === 'database') winAuthConfig.database = value;
  if (key === 'port') winAuthConfig.port = parseInt(value, 10);
}

// Function to get current Windows username
function getCurrentWindowsUser() {
  return new Promise((resolve) => {
    exec('whoami', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting current user: ${error.message}`);
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

// Function to check network connectivity
async function checkNetworkConnectivity(server) {
  console.log(`\n=== Network Connectivity Check for ${server} ===`);
  
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
      const port = winAuthConfig.port;
      
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

// Test Windows Authentication
async function testWindowsAuth() {
  console.log('\n=== Testing Windows Authentication ===');
  
  // Get current Windows user
  const currentUser = await getCurrentWindowsUser();
  console.log(`Current Windows user: ${currentUser}`);
  
  console.log('Connection details:');
  console.log(JSON.stringify(winAuthConfig, null, 2));
  
  try {
    console.log('Attempting to connect with Windows Authentication...');
    const pool = new mssql.ConnectionPool(winAuthConfig);
    await pool.connect();
    
    console.log('✅ Windows Authentication successful!');
    
    // Try a simple query
    try {
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log('✅ Query successful');
      console.log('SQL Server version:');
      console.log(result.recordset[0].version);
      
      // Check available databases
      const dbResult = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
        ORDER BY name
      `);
      
      if (dbResult.recordset && dbResult.recordset.length > 0) {
        console.log('\nAvailable user databases:');
        dbResult.recordset.forEach(db => {
          console.log(`- ${db.name}`);
        });
      }
      
      // Check if target database exists
      const targetDbResult = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name = '${winAuthConfig.database}'
      `);
      
      if (targetDbResult.recordset && targetDbResult.recordset.length > 0) {
        console.log(`\n✅ Database '${winAuthConfig.database}' exists`);
        
        // Try to connect to the target database
        try {
          await pool.request().query(`USE [${winAuthConfig.database}]`);
          console.log(`✅ Successfully connected to '${winAuthConfig.database}'`);
          
          // Check if oe_hdr table exists
          const tableResult = await pool.request().query(`
            SELECT OBJECT_ID('dbo.oe_hdr') as table_id
          `);
          
          if (tableResult.recordset && tableResult.recordset.length > 0 && tableResult.recordset[0].table_id) {
            console.log("✅ Table 'oe_hdr' exists in the database");
            
            // Try the actual query
            const testQuery = "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)";
            console.log(`\nExecuting test query: ${testQuery}`);
            
            const queryResult = await pool.request().query(testQuery);
            if (queryResult.recordset && queryResult.recordset.length > 0) {
              console.log(`✅ Query successful! Result: ${queryResult.recordset[0].value}`);
            }
          } else {
            console.error("❌ Table 'oe_hdr' does not exist in the database");
            
            // List some tables
            const tablesResult = await pool.request().query(`
              SELECT TOP 10 name FROM sys.tables ORDER BY name
            `);
            
            if (tablesResult.recordset && tablesResult.recordset.length > 0) {
              console.log('\nSome tables in the database:');
              tablesResult.recordset.forEach(table => {
                console.log(`- ${table.name}`);
              });
            }
          }
        } catch (useError) {
          console.error(`❌ Error connecting to '${winAuthConfig.database}': ${useError.message}`);
        }
      } else {
        console.error(`❌ Database '${winAuthConfig.database}' does not exist`);
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
    winAuthConfig.server,
    `${winAuthConfig.server}.tallman.com`,
    `${winAuthConfig.server}.tallmanequipment.com`,
    'localhost'
  ];
  
  // Add IP address if DNS resolution is successful
  try {
    const addresses = await dns.lookup(winAuthConfig.server, { all: true });
    if (addresses && addresses.length > 0) {
      alternativeServers.push(addresses[0].address);
    }
  } catch (error) {
    // Ignore DNS errors
  }
  
  console.log('Trying the following server names:');
  alternativeServers.forEach(server => console.log(`- ${server}`));
  
  for (const server of alternativeServers) {
    console.log(`\n=== Testing server: ${server} ===`);
    
    // Check network connectivity first
    const isReachable = await checkNetworkConnectivity(server);
    
    if (!isReachable) {
      console.log(`Skipping ${server} due to network connectivity issues`);
      continue;
    }
    
    const serverConfig = {
      ...winAuthConfig,
      server
    };
    
    try {
      console.log(`Attempting to connect to ${server} with Windows Authentication...`);
      const pool = new mssql.ConnectionPool(serverConfig);
      await pool.connect();
      
      console.log(`✅ Connection to ${server} successful!`);
      
      // Try a simple query
      try {
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('✅ Query successful');
        console.log('SQL Server version:');
        console.log(result.recordset[0].version);
      } catch (queryError) {
        console.error('❌ Query failed:', queryError.message);
      }
      
      // Close the connection
      await pool.close();
      
      return server;
    } catch (error) {
      console.error(`❌ Connection to ${server} failed: ${error.message}`);
    }
  }
  
  return null;
}

// Main function
async function main() {
  try {
    console.log('=== P21 SQL Server Windows Authentication Test ===');
    console.log(`Server: ${winAuthConfig.server}`);
    console.log(`Database: ${winAuthConfig.database}`);
    console.log(`Port: ${winAuthConfig.port}`);
    
    // Check network connectivity
    const isReachable = await checkNetworkConnectivity(winAuthConfig.server);
    
    if (!isReachable) {
      console.error(`\n❌ Server ${winAuthConfig.server} is not reachable`);
      console.log('Trying alternative server names...');
      
      const workingServer = await tryAlternativeServerNames();
      
      if (workingServer) {
        console.log(`\n✅ Found working server: ${workingServer}`);
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
      const winAuthSuccess = await testWindowsAuth();
      
      if (!winAuthSuccess) {
        console.log('\nTrying alternative server names...');
        
        const workingServer = await tryAlternativeServerNames();
        
        if (workingServer) {
          console.log(`\n✅ Found working server: ${workingServer}`);
          console.log(`Use this server name in your connection configuration.`);
        } else {
          console.error('\n❌ Windows Authentication failed for all server names');
          console.log('\nRecommendations:');
          console.log('1. Verify SQL Server is running and accepting connections');
          console.log('2. Ensure SQL Server is configured to allow Windows Authentication');
          console.log('3. Check if your Windows account has access to the SQL Server');
          console.log('4. Try using a SQL login instead of Windows Authentication');
        }
      }
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
