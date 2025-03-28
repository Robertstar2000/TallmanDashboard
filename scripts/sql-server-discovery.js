// SQL Server Instance and Database Discovery Script
// This script attempts to discover SQL Server instances and databases on remote servers

// Import required modules
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const mssql = require('mssql');
const net = require('net');
const dns = require('dns').promises;

// Target servers
const servers = [
  {
    name: 'SQL01',
    ip: '10.10.20.28',
    description: 'P21 Server'
  },
  {
    name: 'TS03',
    ip: '10.10.20.13',
    description: 'POR Server'
  }
];

// Common SQL Server ports
const commonPorts = [1433, 1434, 2433, 4022, 5022, 14330, 14331, 14333, 14334];

// Function to run PowerShell commands
async function runPowerShell(command) {
  try {
    const { stdout } = await execPromise(`powershell -Command "${command}"`);
    return stdout.trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to check if a port is open
function isPortOpen(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpen = false;
    
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      isOpen = true;
      socket.destroy();
    });
    
    socket.on('timeout', () => {
      socket.destroy();
    });
    
    socket.on('error', () => {
      socket.destroy();
    });
    
    socket.on('close', () => {
      resolve(isOpen);
    });
    
    socket.connect(port, host);
  });
}

// Function to discover SQL Server instances using sqlcmd
async function discoverSqlServerInstances() {
  console.log('=== Discovering SQL Server Instances ===');
  
  try {
    console.log('\nAttempting to discover SQL Server instances using sqlcmd...');
    const sqlcmdResult = await runPowerShell('sqlcmd -L');
    
    if (sqlcmdResult.startsWith('Error:')) {
      console.log('❌ sqlcmd command failed:', sqlcmdResult);
    } else {
      console.log('SQL Server instances found:');
      console.log(sqlcmdResult);
    }
  } catch (error) {
    console.error('Error discovering SQL Server instances:', error.message);
  }
  
  // Try using PowerShell's Get-SqlInstance if available
  try {
    console.log('\nAttempting to discover SQL Server instances using PowerShell...');
    const powershellResult = await runPowerShell('Get-Module -ListAvailable -Name SqlServer; if($?) { Get-SqlInstance -ErrorAction SilentlyContinue | Format-Table ComputerName, Name, Edition, Version -AutoSize | Out-String } else { "SqlServer module not available" }');
    
    if (powershellResult.includes('not available') || powershellResult.startsWith('Error:')) {
      console.log('❌ PowerShell SQL Server module not available');
    } else {
      console.log('SQL Server instances found via PowerShell:');
      console.log(powershellResult);
    }
  } catch (error) {
    console.error('Error using PowerShell for discovery:', error.message);
  }
}

// Function to scan for SQL Server ports
async function scanForSqlServerPorts(server) {
  console.log(`\n=== Scanning ${server.name} (${server.ip}) for SQL Server Ports ===`);
  
  const openPorts = [];
  
  for (const port of commonPorts) {
    process.stdout.write(`Checking port ${port}... `);
    
    const isOpen = await isPortOpen(server.ip, port);
    
    if (isOpen) {
      console.log('OPEN ✅');
      openPorts.push(port);
    } else {
      console.log('CLOSED ❌');
    }
  }
  
  return openPorts;
}

// Function to try connecting to SQL Server with various methods
async function tryConnectToSqlServer(server, port) {
  console.log(`\n=== Attempting to connect to SQL Server on ${server.name}:${port} ===`);
  
  // Connection configurations to try
  const configs = [
    // Windows Authentication
    {
      server: server.name,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 5000,
        integrated: true,
        trustedConnection: true
      }
    },
    // Windows Authentication with IP
    {
      server: server.ip,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 5000,
        integrated: true,
        trustedConnection: true
      }
    },
    // SQL Authentication with SA
    {
      server: server.name,
      port: port,
      user: 'sa',
      password: 'Tallman2023',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 5000
      }
    },
    // SQL Authentication with SA and IP
    {
      server: server.ip,
      port: port,
      user: 'sa',
      password: 'Tallman2023',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 5000
      }
    }
  ];
  
  // Try each configuration
  for (const config of configs) {
    try {
      console.log(`Trying connection with ${config.user ? 'SQL Authentication' : 'Windows Authentication'} to ${config.server}:${config.port}...`);
      
      const pool = new mssql.ConnectionPool(config);
      await pool.connect();
      
      console.log('✅ Connection successful!');
      
      // Try to get SQL Server version
      try {
        const versionResult = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Server version:');
        console.log(versionResult.recordset[0].version);
        
        // Try to list databases
        try {
          const databasesResult = await pool.request().query(`
            SELECT name, database_id, create_date 
            FROM sys.databases
            ORDER BY name
          `);
          
          console.log('\nDatabases on this server:');
          databasesResult.recordset.forEach(db => {
            console.log(`- ${db.name} (ID: ${db.database_id}, Created: ${db.create_date})`);
          });
          
          // Check for specific databases
          const hasP21 = databasesResult.recordset.some(db => db.name.toLowerCase() === 'p21play' || db.name.toLowerCase() === 'p21');
          const hasPOR = databasesResult.recordset.some(db => db.name.toLowerCase() === 'por');
          
          if (hasP21) {
            console.log('\n✅ P21 database found on this server!');
          }
          
          if (hasPOR) {
            console.log('\n✅ POR database found on this server!');
          }
        } catch (dbError) {
          console.error('❌ Error listing databases:', dbError.message);
        }
      } catch (versionError) {
        console.error('❌ Error getting SQL Server version:', versionError.message);
      }
      
      // Close the connection
      await pool.close();
      
      return true;
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      
      if (error.originalError) {
        console.error('Original error details:', error.originalError.message || error.originalError);
      }
    }
  }
  
  return false;
}

// Function to try connecting with connection strings
async function tryConnectionStrings(server, port) {
  console.log(`\n=== Trying Connection Strings for ${server.name}:${port} ===`);
  
  const connectionStrings = [
    // Windows Authentication
    `Server=${server.name},${port};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=5;`,
    `Server=${server.ip},${port};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=5;`,
    // SQL Authentication
    `Server=${server.name},${port};User Id=sa;Password=Tallman2023;TrustServerCertificate=True;Connection Timeout=5;`,
    `Server=${server.ip},${port};User Id=sa;Password=Tallman2023;TrustServerCertificate=True;Connection Timeout=5;`
  ];
  
  for (const connectionString of connectionStrings) {
    try {
      console.log(`Trying connection string: ${connectionString}`);
      
      const pool = new mssql.ConnectionPool(connectionString);
      await pool.connect();
      
      console.log('✅ Connection successful!');
      
      // Try to get SQL Server version
      try {
        const versionResult = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Server version:');
        console.log(versionResult.recordset[0].version);
        
        // Try to list databases
        try {
          const databasesResult = await pool.request().query(`
            SELECT name, database_id, create_date 
            FROM sys.databases
            ORDER BY name
          `);
          
          console.log('\nDatabases on this server:');
          databasesResult.recordset.forEach(db => {
            console.log(`- ${db.name} (ID: ${db.database_id}, Created: ${db.create_date})`);
          });
        } catch (dbError) {
          console.error('❌ Error listing databases:', dbError.message);
        }
      } catch (versionError) {
        console.error('❌ Error getting SQL Server version:', versionError.message);
      }
      
      // Close the connection
      await pool.close();
      
      return true;
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
    }
  }
  
  return false;
}

// Function to check for SQL Server services on remote machine
async function checkSqlServerServices(server) {
  console.log(`\n=== Checking SQL Server Services on ${server.name} ===`);
  
  try {
    const command = `
      $ErrorActionPreference = "SilentlyContinue"
      $result = Invoke-Command -ComputerName ${server.name} -ScriptBlock {
        Get-Service -Name *SQL* | Where-Object { $_.Status -eq "Running" } | Format-Table Name, DisplayName, Status -AutoSize | Out-String
      } -ErrorAction SilentlyContinue
      if ($result) { $result } else { "Could not access remote services" }
    `;
    
    const servicesResult = await runPowerShell(command);
    
    if (servicesResult.includes('Could not access') || servicesResult.startsWith('Error:')) {
      console.log(`❌ Could not access services on ${server.name}`);
    } else {
      console.log('Running SQL Server services:');
      console.log(servicesResult);
    }
  } catch (error) {
    console.error(`Error checking services: ${error.message}`);
  }
}

// Function to check for SQL Server registry on remote machine
async function checkSqlServerRegistry(server) {
  console.log(`\n=== Checking SQL Server Registry on ${server.name} ===`);
  
  try {
    const command = `
      $ErrorActionPreference = "SilentlyContinue"
      $result = Invoke-Command -ComputerName ${server.name} -ScriptBlock {
        if (Test-Path "HKLM:\\SOFTWARE\\Microsoft\\Microsoft SQL Server") {
          Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL" -ErrorAction SilentlyContinue | Out-String
        } else {
          "SQL Server registry keys not found"
        }
      } -ErrorAction SilentlyContinue
      if ($result) { $result } else { "Could not access remote registry" }
    `;
    
    const registryResult = await runPowerShell(command);
    
    if (registryResult.includes('Could not access') || registryResult.startsWith('Error:')) {
      console.log(`❌ Could not access registry on ${server.name}`);
    } else {
      console.log('SQL Server registry information:');
      console.log(registryResult);
    }
  } catch (error) {
    console.error(`Error checking registry: ${error.message}`);
  }
}

// Function to check for SQL Server Browser UDP response
async function checkSqlServerBrowser(server) {
  console.log(`\n=== Checking SQL Server Browser on ${server.name} ===`);
  
  try {
    // SQL Server Browser uses UDP port 1434
    const udpTest = await runPowerShell(`Test-NetConnection -ComputerName ${server.ip} -Port 1434 -InformationLevel Quiet`);
    
    if (udpTest === 'True') {
      console.log('✅ SQL Server Browser port is open');
      
      // Try to query SQL Server Browser
      console.log('Attempting to query SQL Server Browser...');
      
      // This is a simplified approach - in reality, you would send a UDP packet and parse the response
      const isOpen = await isPortOpen(server.ip, 1434);
      
      if (isOpen) {
        console.log('✅ SQL Server Browser appears to be running');
      } else {
        console.log('❌ SQL Server Browser port is open but not responding');
      }
    } else {
      console.log('❌ SQL Server Browser port is closed');
    }
  } catch (error) {
    console.error(`Error checking SQL Server Browser: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log('=== SQL Server Instance and Database Discovery ===');
  
  // Get current user
  const currentUser = await runPowerShell('whoami');
  console.log(`Current User: ${currentUser}`);
  
  // Discover SQL Server instances
  await discoverSqlServerInstances();
  
  // Process each server
  for (const server of servers) {
    console.log(`\n\n=== Processing ${server.name} (${server.description}) ===`);
    
    // Check if server is reachable
    const pingResult = await runPowerShell(`Test-Connection -ComputerName ${server.name} -Count 2 -Quiet`);
    
    if (pingResult !== 'True') {
      console.log(`❌ Cannot ping ${server.name}. Skipping further checks.`);
      continue;
    }
    
    console.log(`✅ ${server.name} is reachable via ping`);
    
    // Check for SQL Server services
    await checkSqlServerServices(server);
    
    // Check for SQL Server registry
    await checkSqlServerRegistry(server);
    
    // Check for SQL Server Browser
    await checkSqlServerBrowser(server);
    
    // Scan for SQL Server ports
    const openPorts = await scanForSqlServerPorts(server);
    
    if (openPorts.length === 0) {
      console.log(`\n❌ No SQL Server ports found open on ${server.name}`);
      console.log('This suggests that SQL Server might not be running or is blocked by a firewall.');
      continue;
    }
    
    console.log(`\n✅ Found ${openPorts.length} open port(s) on ${server.name}: ${openPorts.join(', ')}`);
    
    // Try connecting to each open port
    let connectionSuccessful = false;
    
    for (const port of openPorts) {
      const connected = await tryConnectToSqlServer(server, port);
      
      if (!connected) {
        // Try connection strings as a fallback
        const connStringSuccess = await tryConnectionStrings(server, port);
        
        if (connStringSuccess) {
          connectionSuccessful = true;
          break;
        }
      } else {
        connectionSuccessful = true;
        break;
      }
    }
    
    if (!connectionSuccessful) {
      console.log(`\n❌ Could not connect to SQL Server on ${server.name} despite finding open ports`);
      console.log('This suggests authentication issues or that the open ports are not SQL Server.');
    }
  }
  
  console.log('\n=== Discovery Complete ===');
}

// Run the main function
main();
