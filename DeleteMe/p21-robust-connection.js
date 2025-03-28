// P21 SQL Server Robust Connection Implementation
// This script implements a robust connection strategy with fallback mechanisms

// Import required modules
const mssql = require('mssql');
const fs = require('fs').promises;
const path = require('path');
const dns = require('dns').promises;
const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Connection configuration templates
const baseConfig = {
  server: process.env.P21_SERVER || 'SQL01',
  database: process.env.P21_DATABASE || 'P21play',
  user: process.env.P21_USER || 'SA',
  password: process.env.P21_PASSWORD || '',
  port: parseInt(process.env.P21_PORT || '1433', 10),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
    connectTimeout: 15000
  }
};

// Get command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') baseConfig.server = value;
  if (key === 'database') baseConfig.database = value;
  if (key === 'user') baseConfig.user = value;
  if (key === 'password') baseConfig.password = value;
  if (key === 'port') baseConfig.port = parseInt(value, 10);
}

// Windows Authentication configuration
const winAuthConfig = {
  server: baseConfig.server,
  database: baseConfig.database,
  port: baseConfig.port,
  options: {
    ...baseConfig.options,
    integrated: true,
    trustedConnection: true
  }
};

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

// Function to save successful connection config
async function saveSuccessfulConfig(config, type) {
  try {
    // Create a safe copy without password
    const safeCopy = { ...config };
    if (safeCopy.password) {
      safeCopy.password = '********';
    }
    
    // Create config object to save
    const configData = {
      type,
      timestamp: new Date().toISOString(),
      config: safeCopy,
      connectionString: buildConnectionString(config)
    };
    
    // Save to file
    const configDir = path.join(__dirname, '..', 'config');
    await fs.mkdir(configDir, { recursive: true });
    
    const configFile = path.join(configDir, 'successful-connection.json');
    await fs.writeFile(configFile, JSON.stringify(configData, null, 2));
    
    console.log(`\nSuccessful connection config saved to ${configFile}`);
  } catch (error) {
    console.error(`Error saving config: ${error.message}`);
  }
}

// Function to build connection string
function buildConnectionString(config) {
  if (config.options && (config.options.integrated || config.options.trustedConnection)) {
    return `Server=${config.server},${config.port};Database=${config.database};Trusted_Connection=yes;`;
  } else {
    return `Server=${config.server},${config.port};Database=${config.database};User Id=${config.user};Password=********;`;
  }
}

// Function to test SQL Authentication
async function testSqlAuth(config) {
  console.log('\n=== Testing SQL Authentication ===');
  console.log('Connection details:');
  
  // Log the configuration (excluding password)
  const configCopy = { ...config };
  delete configCopy.password;
  console.log(JSON.stringify(configCopy, null, 2));
  
  try {
    console.log('Attempting to connect with SQL Authentication...');
    const pool = new mssql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ SQL Authentication successful!');
    
    // Try a simple query
    try {
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log('✅ Query successful');
      console.log('SQL Server version:');
      console.log(result.recordset[0].version);
      
      // Try the actual query
      const testQuery = "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)";
      console.log(`\nExecuting test query: ${testQuery}`);
      
      try {
        const queryResult = await pool.request().query(testQuery);
        if (queryResult.recordset && queryResult.recordset.length > 0) {
          console.log(`✅ Query successful! Result: ${queryResult.recordset[0].value}`);
        }
      } catch (queryError) {
        console.error(`❌ Test query failed: ${queryError.message}`);
        
        // Try to list some tables
        try {
          const tablesResult = await pool.request().query(`
            SELECT TOP 10 name FROM sys.tables ORDER BY name
          `);
          
          if (tablesResult.recordset && tablesResult.recordset.length > 0) {
            console.log('\nSome tables in the database:');
            tablesResult.recordset.forEach(table => {
              console.log(`- ${table.name}`);
            });
          }
        } catch (tablesError) {
          console.error(`Error listing tables: ${tablesError.message}`);
        }
      }
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
    }
    
    // Close the connection
    await pool.close();
    
    // Save successful config
    await saveSuccessfulConfig(config, 'SQL Authentication');
    
    return true;
  } catch (error) {
    console.error(`❌ SQL Authentication failed: ${error.message}`);
    
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

// Function to test Windows Authentication
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
      
      // Try the actual query
      const testQuery = "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)";
      console.log(`\nExecuting test query: ${testQuery}`);
      
      try {
        const queryResult = await pool.request().query(testQuery);
        if (queryResult.recordset && queryResult.recordset.length > 0) {
          console.log(`✅ Query successful! Result: ${queryResult.recordset[0].value}`);
        }
      } catch (queryError) {
        console.error(`❌ Test query failed: ${queryError.message}`);
        
        // Try to list some tables
        try {
          const tablesResult = await pool.request().query(`
            SELECT TOP 10 name FROM sys.tables ORDER BY name
          `);
          
          if (tablesResult.recordset && tablesResult.recordset.length > 0) {
            console.log('\nSome tables in the database:');
            tablesResult.recordset.forEach(table => {
              console.log(`- ${table.name}`);
            });
          }
        } catch (tablesError) {
          console.error(`Error listing tables: ${tablesError.message}`);
        }
      }
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
    }
    
    // Close the connection
    await pool.close();
    
    // Save successful config
    await saveSuccessfulConfig(config, 'Windows Authentication');
    
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

// Function to try alternative server names
async function tryAlternativeServerNames() {
  console.log('\n=== Trying Alternative Server Names ===');
  
  // Get domain from current user
  const currentUser = await getCurrentWindowsUser();
  let domain = '';
  
  if (currentUser && currentUser.includes('\\')) {
    domain = currentUser.split('\\')[0];
  }
  
  // Generate alternative server names
  const alternativeServers = [
    baseConfig.server,
    `${baseConfig.server}.tallman.com`,
    `${baseConfig.server}.tallmanequipment.com`
  ];
  
  // Add IP address if DNS resolution is successful
  try {
    const addresses = await dns.lookup(baseConfig.server, { all: true });
    if (addresses && addresses.length > 0) {
      alternativeServers.push(addresses[0].address);
    }
  } catch (error) {
    // Ignore DNS errors
  }
  
  console.log('Trying the following server names:');
  alternativeServers.forEach(server => console.log(`- ${server}`));
  
  // Try each server with both authentication methods
  for (const server of alternativeServers) {
    console.log(`\n=== Testing server: ${server} ===`);
    
    // Check network connectivity first
    const isReachable = await checkNetworkConnectivity(server, baseConfig.port);
    
    if (!isReachable) {
      console.log(`Skipping ${server} due to network connectivity issues`);
      continue;
    }
    
    // Try SQL Authentication
    const sqlConfig = {
      ...baseConfig,
      server
    };
    
    const sqlAuthSuccess = await testSqlAuth(sqlConfig);
    
    if (sqlAuthSuccess) {
      return { server, authType: 'sql', config: sqlConfig };
    }
    
    // Try Windows Authentication
    const winConfig = {
      ...winAuthConfig,
      server
    };
    
    const winAuthSuccess = await testWindowsAuth(winConfig);
    
    if (winAuthSuccess) {
      return { server, authType: 'windows', config: winConfig };
    }
  }
  
  return null;
}

// Function to implement the connection in the codebase
async function implementConnection(connectionInfo) {
  if (!connectionInfo) return false;
  
  console.log('\n=== Implementing Connection in Codebase ===');
  
  try {
    // Create connection implementation file
    const implementationCode = `// P21 SQL Server Connection Implementation
// Generated by p21-robust-connection.js

// This file contains the connection configuration for P21 SQL Server
// that was successfully tested and verified to work.

// Connection Type: ${connectionInfo.authType}
// Server: ${connectionInfo.server}
// Database: ${connectionInfo.config.database}
// Generated: ${new Date().toISOString()}

/**
 * Get P21 SQL Server connection configuration
 * @returns {Object} Connection configuration for mssql package
 */
function getP21ConnectionConfig() {
  return ${JSON.stringify(connectionInfo.config, null, 2)};
}

/**
 * Get P21 SQL Server connection string
 * @returns {string} Connection string for SQL Server
 */
function getP21ConnectionString() {
  return "${buildConnectionString(connectionInfo.config)}";
}

/**
 * Test connection to P21 SQL Server
 * @returns {Promise<boolean>} True if connection successful
 */
async function testP21Connection() {
  const mssql = require('mssql');
  
  try {
    const pool = new mssql.ConnectionPool(getP21ConnectionConfig());
    await pool.connect();
    
    // Try a simple query
    const result = await pool.request().query('SELECT 1 as success');
    
    // Close the connection
    await pool.close();
    
    return result.recordset[0].success === 1;
  } catch (error) {
    console.error(\`P21 connection test failed: \${error.message}\`);
    return false;
  }
}

/**
 * Execute a query against P21 SQL Server
 * @param {string} query SQL query to execute
 * @returns {Promise<any>} Query result
 */
async function executeP21Query(query) {
  const mssql = require('mssql');
  
  try {
    const pool = new mssql.ConnectionPool(getP21ConnectionConfig());
    await pool.connect();
    
    // Execute the query
    const result = await pool.request().query(query);
    
    // Close the connection
    await pool.close();
    
    return result.recordset;
  } catch (error) {
    console.error(\`P21 query execution failed: \${error.message}\`);
    throw error;
  }
}

module.exports = {
  getP21ConnectionConfig,
  getP21ConnectionString,
  testP21Connection,
  executeP21Query
};
`;
    
    // Write implementation file
    const implementationFile = path.join(__dirname, '..', 'lib', 'db', 'p21-connection.js');
    await fs.writeFile(implementationFile, implementationCode);
    
    console.log(`\n✅ Connection implementation written to ${implementationFile}`);
    
    // Create a test script that uses the implementation
    const testScriptCode = `// P21 SQL Server Connection Test
// This script tests the P21 connection implementation

const { testP21Connection, executeP21Query } = require('../lib/db/p21-connection');

async function main() {
  try {
    console.log('Testing P21 SQL Server connection...');
    
    const connectionSuccess = await testP21Connection();
    
    if (connectionSuccess) {
      console.log('✅ Connection test successful!');
      
      // Execute the production SQL expression
      console.log('\\nExecuting production SQL expression...');
      const query = 'SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)';
      
      const result = await executeP21Query(query);
      
      if (result && result.length > 0) {
        console.log(\`✅ Query successful! Result: \${result[0].value}\`);
      } else {
        console.log('⚠️ Query returned no results');
      }
    } else {
      console.error('❌ Connection test failed');
    }
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
  }
}

// Run the main function
main();
`;
    
    // Write test script
    const testScriptFile = path.join(__dirname, 'test-p21-implementation.js');
    await fs.writeFile(testScriptFile, testScriptCode);
    
    console.log(`✅ Test script written to ${testScriptFile}`);
    
    return true;
  } catch (error) {
    console.error(`Error implementing connection: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('=== P21 SQL Server Robust Connection Implementation ===');
    console.log(`Server: ${baseConfig.server}`);
    console.log(`Database: ${baseConfig.database}`);
    console.log(`User: ${baseConfig.user}`);
    console.log(`Port: ${baseConfig.port}`);
    
    // Check network connectivity
    const isReachable = await checkNetworkConnectivity(baseConfig.server, baseConfig.port);
    
    if (!isReachable) {
      console.error(`\n❌ Server ${baseConfig.server} is not reachable`);
      console.log('Trying alternative server names...');
      
      const connectionInfo = await tryAlternativeServerNames();
      
      if (connectionInfo) {
        console.log(`\n✅ Found working connection configuration!`);
        console.log(`Server: ${connectionInfo.server}`);
        console.log(`Authentication Type: ${connectionInfo.authType}`);
        
        // Implement the connection in the codebase
        await implementConnection(connectionInfo);
      } else {
        console.error('\n❌ Could not establish a connection to any server');
        console.log('\nRecommendations:');
        console.log('1. Verify SQL Server is running and accepting connections');
        console.log('2. Check network connectivity and firewall settings');
        console.log('3. Ensure authentication credentials are correct');
        console.log('4. Consult with database administrator for assistance');
      }
    } else {
      // Try SQL Authentication first
      const sqlAuthSuccess = await testSqlAuth(baseConfig);
      
      if (sqlAuthSuccess) {
        console.log('\n✅ SQL Authentication successful!');
        
        // Implement the connection in the codebase
        await implementConnection({ server: baseConfig.server, authType: 'sql', config: baseConfig });
      } else {
        console.log('\nTrying Windows Authentication...');
        
        const winAuthSuccess = await testWindowsAuth(winAuthConfig);
        
        if (winAuthSuccess) {
          console.log('\n✅ Windows Authentication successful!');
          
          // Implement the connection in the codebase
          await implementConnection({ server: baseConfig.server, authType: 'windows', config: winAuthConfig });
        } else {
          console.log('\nTrying alternative server names and configurations...');
          
          const connectionInfo = await tryAlternativeServerNames();
          
          if (connectionInfo) {
            console.log(`\n✅ Found working connection configuration!`);
            console.log(`Server: ${connectionInfo.server}`);
            console.log(`Authentication Type: ${connectionInfo.authType}`);
            
            // Implement the connection in the codebase
            await implementConnection(connectionInfo);
          } else {
            console.error('\n❌ All connection attempts failed');
            console.log('\nRecommendations:');
            console.log('1. Verify SQL Server is running and accepting connections');
            console.log('2. Ensure SQL Server is configured for Mixed Mode Authentication');
            console.log('3. Check if the login credentials are correct');
            console.log('4. Verify the target database exists and is online');
            console.log('5. Check SQL Server error logs for more information');
            console.log('6. Consult with database administrator for assistance');
          }
        }
      }
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
