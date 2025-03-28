// POR SQL Server Port Scanner
// This script scans for SQL Server running on various ports

// Import required modules
const net = require('net');
const dns = require('dns').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mssql = require('mssql');

// Default server information
const serverInfo = {
  server: 'TS03',
  database: 'POR',
  commonPorts: [1433, 1434, 14330, 14331, 14333, 14334, 1444, 2433, 4022, 5022]
};

// Get command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') serverInfo.server = value;
  if (key === 'database') serverInfo.database = value;
  if (key === 'ports') {
    try {
      serverInfo.commonPorts = value.split(',').map(p => parseInt(p.trim(), 10));
    } catch (e) {
      console.error('Error parsing ports:', e.message);
    }
  }
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

// Function to resolve server to IP
async function resolveServerToIP(server) {
  console.log(`\n=== Resolving ${server} to IP address ===`);
  
  try {
    const addresses = await dns.lookup(server, { all: true });
    
    if (addresses && addresses.length > 0) {
      console.log('DNS resolution successful:');
      addresses.forEach(addr => {
        console.log(`- ${addr.address} (${addr.family === 4 ? 'IPv4' : 'IPv6'})`);
      });
      
      return addresses[0].address;
    } else {
      console.error(`DNS resolution failed for ${server}`);
      return null;
    }
  } catch (error) {
    console.error(`DNS resolution error: ${error.message}`);
    return null;
  }
}

// Function to ping the server
async function pingServer(server) {
  console.log(`\n=== Pinging ${server} ===`);
  
  try {
    const { stdout } = await execPromise(`ping -n 4 ${server}`);
    console.log(stdout);
    
    // Check if ping was successful
    if (stdout.includes('(0% loss)')) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(`Ping error: ${error.message}`);
    return false;
  }
}

// Function to scan a single port
function scanPort(ip, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;
    
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });
    
    socket.on('timeout', () => {
      socket.destroy();
    });
    
    socket.on('error', () => {
      socket.destroy();
    });
    
    socket.on('close', () => {
      resolve(status);
    });
    
    socket.connect(port, ip);
  });
}

// Function to scan multiple ports
async function scanPorts(ip, ports) {
  console.log(`\n=== Scanning ports on ${ip} ===`);
  
  const openPorts = [];
  
  for (const port of ports) {
    process.stdout.write(`Checking port ${port}... `);
    
    const isOpen = await scanPort(ip, port);
    
    if (isOpen) {
      console.log('OPEN ✅');
      openPorts.push(port);
    } else {
      console.log('CLOSED ❌');
    }
  }
  
  return openPorts;
}

// Function to test SQL Server connection on a specific port
async function testSqlServerConnection(server, database, port) {
  console.log(`\n=== Testing SQL Server connection to ${server}:${port} ===`);
  
  // Windows Authentication configuration
  const config = {
    server,
    database,
    port,
    options: {
      trustServerCertificate: true,
      encrypt: false,
      enableArithAbort: true,
      connectTimeout: 10000,
      integrated: true,
      trustedConnection: true
    }
  };
  
  console.log('Connection details:');
  console.log(JSON.stringify(config, null, 2));
  
  try {
    console.log('Attempting to connect with Windows Authentication...');
    const pool = new mssql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Try a simple query
    try {
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log('✅ Query successful');
      console.log('SQL Server version:');
      console.log(result.recordset[0].version);
      
      // Try to access the database
      try {
        await pool.request().query(`USE [${database}]`);
        console.log(`✅ Successfully connected to '${database}' database`);
        
        // Try to list some tables
        const tablesResult = await pool.request().query(`
          SELECT TOP 10 name FROM sys.tables ORDER BY name
        `);
        
        if (tablesResult.recordset && tablesResult.recordset.length > 0) {
          console.log('\nSome tables in the database:');
          tablesResult.recordset.forEach(table => {
            console.log(`- ${table.name}`);
          });
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
    console.error(`❌ Connection failed: ${error.message}`);
    
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

// Function to try connecting to SQL Server on multiple ports
async function tryMultiplePorts(server, database, ports) {
  console.log(`\n=== Trying to connect to SQL Server on multiple ports ===`);
  
  for (const port of ports) {
    console.log(`\nTrying port ${port}...`);
    
    const success = await testSqlServerConnection(server, database, port);
    
    if (success) {
      console.log(`\n✅ Successfully connected to SQL Server on port ${port}`);
      return { server, port, database };
    }
  }
  
  return null;
}

// Function to try alternative server names
async function tryAlternativeServerNames(database, openPorts) {
  console.log('\n=== Trying Alternative Server Names ===');
  
  // Get domain from current user
  const currentUser = await getCurrentWindowsUser();
  let domain = '';
  
  if (currentUser && currentUser.includes('\\')) {
    domain = currentUser.split('\\')[0];
  }
  
  // Generate alternative server names
  const alternativeServers = [
    serverInfo.server,
    `${serverInfo.server}.tallman.com`,
    '10.10.20.13' // Direct IP address
  ];
  
  console.log('Trying the following server names:');
  alternativeServers.forEach(server => console.log(`- ${server}`));
  
  for (const server of alternativeServers) {
    console.log(`\n=== Testing server: ${server} ===`);
    
    // Try each open port
    for (const port of openPorts) {
      console.log(`\nTrying ${server}:${port}...`);
      
      const success = await testSqlServerConnection(server, database, port);
      
      if (success) {
        console.log(`\n✅ Successfully connected to SQL Server at ${server}:${port}`);
        return { server, port, database };
      }
    }
  }
  
  return null;
}

// Main function
async function main() {
  try {
    console.log('=== POR SQL Server Port Scanner ===');
    console.log(`Server: ${serverInfo.server}`);
    console.log(`Database: ${serverInfo.database}`);
    console.log(`Ports to scan: ${serverInfo.commonPorts.join(', ')}`);
    
    // Get current Windows user
    const currentUser = await getCurrentWindowsUser();
    console.log(`Current Windows user: ${currentUser}`);
    
    // Resolve server to IP
    const serverIP = await resolveServerToIP(serverInfo.server);
    
    if (!serverIP) {
      console.error(`\n❌ Could not resolve ${serverInfo.server} to an IP address`);
      return;
    }
    
    // Ping the server
    const pingSuccess = await pingServer(serverInfo.server);
    
    if (!pingSuccess) {
      console.error(`\n❌ Could not ping ${serverInfo.server}`);
      console.log('The server might be offline or blocking ICMP packets');
    }
    
    // Scan ports
    const openPorts = await scanPorts(serverIP, serverInfo.commonPorts);
    
    if (openPorts.length === 0) {
      console.error('\n❌ No open ports found on the server');
      console.log('Recommendations:');
      console.log('1. Verify SQL Server is running on the server');
      console.log('2. Check firewall settings to ensure SQL Server ports are open');
      console.log('3. Confirm the SQL Server instance is configured to allow remote connections');
      console.log('4. Try scanning additional ports by specifying them with --ports');
      return;
    }
    
    console.log(`\n✅ Found ${openPorts.length} open port(s): ${openPorts.join(', ')}`);
    
    // Try connecting to SQL Server on each open port
    const connectionInfo = await tryMultiplePorts(serverInfo.server, serverInfo.database, openPorts);
    
    if (!connectionInfo) {
      console.log('\nTrying alternative server names...');
      
      const altConnectionInfo = await tryAlternativeServerNames(serverInfo.database, openPorts);
      
      if (altConnectionInfo) {
        console.log('\n=== Connection Summary ===');
        console.log(`✅ Successfully connected to POR database`);
        console.log(`Server: ${altConnectionInfo.server}`);
        console.log(`Port: ${altConnectionInfo.port}`);
        console.log(`Database: ${altConnectionInfo.database}`);
        console.log(`Authentication: Windows Authentication`);
        
        console.log('\nUse these settings in your application configuration:');
        console.log(`{`);
        console.log(`  server: "${altConnectionInfo.server}",`);
        console.log(`  database: "${altConnectionInfo.database}",`);
        console.log(`  port: ${altConnectionInfo.port},`);
        console.log(`  options: {`);
        console.log(`    trustServerCertificate: true,`);
        console.log(`    encrypt: false,`);
        console.log(`    enableArithAbort: true,`);
        console.log(`    integrated: true,`);
        console.log(`    trustedConnection: true`);
        console.log(`  }`);
        console.log(`}`);
      } else {
        console.error('\n❌ Could not connect to SQL Server on any port or server name');
        console.log('Recommendations:');
        console.log('1. Verify SQL Server is running and accepting connections');
        console.log('2. Check if your Windows account has access to the SQL Server');
        console.log('3. Ensure the POR database exists on the server');
        console.log('4. Consult with database administrator for assistance');
      }
    } else {
      console.log('\n=== Connection Summary ===');
      console.log(`✅ Successfully connected to POR database`);
      console.log(`Server: ${connectionInfo.server}`);
      console.log(`Port: ${connectionInfo.port}`);
      console.log(`Database: ${connectionInfo.database}`);
      console.log(`Authentication: Windows Authentication`);
      
      console.log('\nUse these settings in your application configuration:');
      console.log(`{`);
      console.log(`  server: "${connectionInfo.server}",`);
      console.log(`  database: "${connectionInfo.database}",`);
      console.log(`  port: ${connectionInfo.port},`);
      console.log(`  options: {`);
      console.log(`    trustServerCertificate: true,`);
      console.log(`    encrypt: false,`);
      console.log(`    enableArithAbort: true,`);
      console.log(`    integrated: true,`);
      console.log(`    trustedConnection: true`);
      console.log(`  }`);
      console.log(`}`);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
