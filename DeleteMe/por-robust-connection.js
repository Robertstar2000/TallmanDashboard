// POR Robust Connection Implementation
// This script attempts to establish a connection to the POR database
// using various methods and configurations

// Import required modules
const mssql = require('mssql');
const dns = require('dns').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// Default connection configuration for POR
const defaultConfig = {
  server: 'TS03',
  database: 'POR',
  domain: 'tallman.com',
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
  
  if (key === 'server') defaultConfig.server = value;
  if (key === 'database') defaultConfig.database = value;
  if (key === 'domain') defaultConfig.domain = value;
}

// Function to get current Windows user
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
  try {
    const addresses = await dns.lookup(server, { all: true });
    
    if (addresses && addresses.length > 0) {
      return addresses[0].address;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

// Function to ping the server
async function pingServer(server) {
  try {
    const { stdout } = await execPromise(`ping -n 2 ${server}`);
    return stdout.includes('(0% loss)');
  } catch (error) {
    return false;
  }
}

// Function to test a connection configuration
async function testConnection(config) {
  try {
    console.log(`Testing connection to ${config.server}...`);
    console.log('Connection details:', JSON.stringify(config, null, 2));
    
    const pool = new mssql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Try a simple query
    try {
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log('✅ Query successful');
      console.log('SQL Server version:', result.recordset[0].version);
      
      // Try to access the database
      try {
        await pool.request().query(`USE [${config.database}]`);
        console.log(`✅ Successfully connected to '${config.database}' database`);
        
        // Try to list some tables
        const tablesResult = await pool.request().query(`
          SELECT TOP 5 name FROM sys.tables ORDER BY name
        `);
        
        if (tablesResult.recordset && tablesResult.recordset.length > 0) {
          console.log('Some tables in the database:');
          tablesResult.recordset.forEach(table => {
            console.log(`- ${table.name}`);
          });
        } else {
          console.log('⚠️ No tables found in the database');
        }
      } catch (dbError) {
        console.error(`❌ Database access error: ${dbError.message}`);
        await pool.close();
        return { success: false, error: dbError.message };
      }
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      await pool.close();
      return { success: false, error: queryError.message };
    }
    
    // Close the connection
    await pool.close();
    
    return { success: true, config };
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    
    if (error.originalError) {
      console.error('Original error details:', error.originalError.message || error.originalError);
    }
    
    return { success: false, error: error.message };
  }
}

// Function to try Windows Authentication with different server name formats
async function tryWindowsAuthWithDifferentServerNames() {
  console.log('\n=== Trying Windows Authentication with Different Server Names ===');
  
  const serverVariations = [
    defaultConfig.server,
    `${defaultConfig.server}.${defaultConfig.domain}`,
    await resolveServerToIP(defaultConfig.server)
  ];
  
  // Add named instance variations
  const namedInstanceVariations = [];
  for (const server of serverVariations) {
    if (server) {
      namedInstanceVariations.push(`${server}\\SQLEXPRESS`);
      namedInstanceVariations.push(`${server}\\MSSQLSERVER`);
      namedInstanceVariations.push(`${server}\\POR`);
    }
  }
  
  // Combine all variations
  const allServerVariations = [...serverVariations, ...namedInstanceVariations].filter(Boolean);
  
  // Try each server variation
  for (const server of allServerVariations) {
    console.log(`\nTrying server: ${server}`);
    
    const config = {
      ...defaultConfig,
      server
    };
    
    // Try with and without port specification
    const configs = [
      config,
      { ...config, port: 1433 }
    ];
    
    for (const cfg of configs) {
      const result = await testConnection(cfg);
      
      if (result.success) {
        return result;
      }
    }
  }
  
  return { success: false, error: 'Failed to connect with any server name variation' };
}

// Function to try connection string format
async function tryConnectionStringFormat() {
  console.log('\n=== Trying Connection String Format ===');
  
  const serverVariations = [
    defaultConfig.server,
    `${defaultConfig.server}.${defaultConfig.domain}`,
    await resolveServerToIP(defaultConfig.server)
  ].filter(Boolean);
  
  for (const server of serverVariations) {
    console.log(`\nTrying server: ${server}`);
    
    // Try different connection string formats
    const connectionStrings = [
      `Server=${server};Database=${defaultConfig.database};Trusted_Connection=True;TrustServerCertificate=True;`,
      `Server=${server};Database=${defaultConfig.database};Integrated Security=SSPI;TrustServerCertificate=True;`,
      `Server=${server}\\SQLEXPRESS;Database=${defaultConfig.database};Trusted_Connection=True;TrustServerCertificate=True;`,
      `Server=${server}\\MSSQLSERVER;Database=${defaultConfig.database};Trusted_Connection=True;TrustServerCertificate=True;`,
      `Server=${server}\\POR;Database=${defaultConfig.database};Trusted_Connection=True;TrustServerCertificate=True;`
    ];
    
    for (const connectionString of connectionStrings) {
      console.log(`Trying connection string: ${connectionString}`);
      
      try {
        const pool = new mssql.ConnectionPool(connectionString);
        await pool.connect();
        
        console.log('✅ Connection successful!');
        
        // Try a simple query
        try {
          const result = await pool.request().query('SELECT @@VERSION as version');
          console.log('✅ Query successful');
          
          // Close the connection
          await pool.close();
          
          return { 
            success: true, 
            connectionString,
            config: { connectionString }
          };
        } catch (queryError) {
          console.error('❌ Query failed:', queryError.message);
          await pool.close();
        }
      } catch (error) {
        console.error(`❌ Connection failed: ${error.message}`);
      }
    }
  }
  
  return { success: false, error: 'Failed to connect with any connection string format' };
}

// Function to try TCP protocol explicitly
async function tryTcpProtocol() {
  console.log('\n=== Trying TCP Protocol Explicitly ===');
  
  const ipAddress = await resolveServerToIP(defaultConfig.server);
  
  if (!ipAddress) {
    return { success: false, error: 'Could not resolve server to IP address' };
  }
  
  console.log(`Server IP address: ${ipAddress}`);
  
  // Try different TCP configurations
  const tcpConfigs = [
    { 
      server: `tcp:${ipAddress}`,
      database: defaultConfig.database,
      options: { ...defaultConfig.options }
    },
    { 
      server: `tcp:${ipAddress},1433`,
      database: defaultConfig.database,
      options: { ...defaultConfig.options }
    },
    { 
      server: `tcp:${ipAddress},1434`,
      database: defaultConfig.database,
      options: { ...defaultConfig.options }
    }
  ];
  
  for (const config of tcpConfigs) {
    const result = await testConnection(config);
    
    if (result.success) {
      return result;
    }
  }
  
  return { success: false, error: 'Failed to connect with TCP protocol' };
}

// Function to try dynamic port discovery
async function tryDynamicPortDiscovery() {
  console.log('\n=== Trying Dynamic Port Discovery ===');
  
  // Try to use SQL Browser service to discover instances
  try {
    console.log(`Attempting to discover SQL Server instances on ${defaultConfig.server}...`);
    
    const { stdout } = await execPromise(`sqlcmd -L`);
    console.log('SQL Server instances found:');
    console.log(stdout);
    
    // Parse the output to find instances
    const lines = stdout.split('\n');
    const instances = [];
    
    for (const line of lines) {
      if (line.includes(defaultConfig.server) || line.includes('10.10.20.13')) {
        instances.push(line.trim());
      }
    }
    
    if (instances.length > 0) {
      console.log(`Found ${instances.length} SQL Server instances`);
      
      for (const instance of instances) {
        console.log(`Trying to connect to instance: ${instance}`);
        
        const config = {
          ...defaultConfig,
          server: instance
        };
        
        const result = await testConnection(config);
        
        if (result.success) {
          return result;
        }
      }
    } else {
      console.log('No SQL Server instances found');
    }
  } catch (error) {
    console.error(`Error discovering SQL Server instances: ${error.message}`);
  }
  
  return { success: false, error: 'Failed to discover SQL Server instances' };
}

// Function to save successful configuration
async function saveSuccessfulConfig(config) {
  try {
    const configDir = path.join(__dirname, '..', 'config');
    const configFile = path.join(configDir, 'por-connection.json');
    
    // Create config directory if it doesn't exist
    try {
      await fs.mkdir(configDir, { recursive: true });
    } catch (mkdirError) {
      console.error(`Error creating config directory: ${mkdirError.message}`);
    }
    
    // Save the configuration
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    
    console.log(`Saved successful configuration to ${configFile}`);
  } catch (error) {
    console.error(`Error saving configuration: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    console.log('=== POR Robust Connection Implementation ===');
    console.log(`Server: ${defaultConfig.server}`);
    console.log(`Database: ${defaultConfig.database}`);
    console.log(`Domain: ${defaultConfig.domain}`);
    
    // Get current Windows user
    const currentUser = await getCurrentWindowsUser();
    console.log(`Current Windows user: ${currentUser}`);
    
    // Check if server is reachable
    const pingSuccess = await pingServer(defaultConfig.server);
    
    if (!pingSuccess) {
      console.error(`\n❌ Could not ping ${defaultConfig.server}`);
      console.log('The server might be offline or blocking ICMP packets');
      console.log('Proceeding with connection attempts anyway...');
    }
    
    // Try different connection methods
    console.log('\n=== Trying Different Connection Methods ===');
    
    // Method 1: Windows Authentication with different server names
    let result = await tryWindowsAuthWithDifferentServerNames();
    
    if (result.success) {
      console.log('\n✅ Successfully connected to POR database!');
      await saveSuccessfulConfig(result.config);
      return;
    }
    
    // Method 2: Connection string format
    result = await tryConnectionStringFormat();
    
    if (result.success) {
      console.log('\n✅ Successfully connected to POR database!');
      await saveSuccessfulConfig(result.config);
      return;
    }
    
    // Method 3: TCP protocol explicitly
    result = await tryTcpProtocol();
    
    if (result.success) {
      console.log('\n✅ Successfully connected to POR database!');
      await saveSuccessfulConfig(result.config);
      return;
    }
    
    // Method 4: Dynamic port discovery
    result = await tryDynamicPortDiscovery();
    
    if (result.success) {
      console.log('\n✅ Successfully connected to POR database!');
      await saveSuccessfulConfig(result.config);
      return;
    }
    
    // If all methods failed
    console.error('\n❌ All connection methods failed');
    console.log('\nRecommendations:');
    console.log('1. Verify SQL Server is running on TS03');
    console.log('2. Check if your Windows account has access to the SQL Server');
    console.log('3. Ensure the POR database exists on the server');
    console.log('4. Check firewall settings to ensure SQL Server ports are open');
    console.log('5. Consult with database administrator for assistance');
    console.log('6. Try specifying the exact connection details if known');
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
