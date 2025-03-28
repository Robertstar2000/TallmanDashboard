// P21 SQL Server Authentication Test Script
// This script focuses specifically on authentication issues

// Import required modules
const mssql = require('mssql');

// Connection configuration
const baseConfig = {
  server: process.env.P21_SERVER || 'SQL01',
  database: process.env.P21_DATABASE || 'P21play',
  user: process.env.P21_USER || 'SA',
  password: process.env.P21_PASSWORD || 'Ted@Admin230',
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

// Test variations of connection configurations
async function testConnectionVariations() {
  console.log('=== P21 SQL Server Authentication Test ===');
  console.log(`Server: ${baseConfig.server}`);
  console.log(`Database: ${baseConfig.database}`);
  console.log(`User: ${baseConfig.user}`);
  console.log(`Port: ${baseConfig.port}`);
  
  // Test configurations to try
  const testConfigs = [
    {
      name: "Default configuration",
      config: { ...baseConfig }
    },
    {
      name: "Connect to master database first",
      config: { ...baseConfig, database: 'master' }
    },
    {
      name: "Explicit domain",
      config: { 
        ...baseConfig, 
        user: baseConfig.user.includes('\\') ? baseConfig.user : `${baseConfig.server}\\${baseConfig.user}`
      }
    },
    {
      name: "Force encryption",
      config: { 
        ...baseConfig, 
        options: { ...baseConfig.options, encrypt: true }
      }
    },
    {
      name: "Windows Authentication",
      config: { 
        server: baseConfig.server,
        database: baseConfig.database,
        port: baseConfig.port,
        options: {
          ...baseConfig.options,
          trustedConnection: true
        }
      }
    },
    {
      name: "Alternative database",
      config: { 
        ...baseConfig, 
        database: 'master'
      }
    }
  ];
  
  // Try each configuration
  for (const test of testConfigs) {
    console.log(`\n=== Testing: ${test.name} ===`);
    console.log('Connection details:');
    
    // Log the configuration (excluding password)
    const configCopy = { ...test.config };
    delete configCopy.password;
    console.log(JSON.stringify(configCopy, null, 2));
    
    try {
      // Create a connection pool
      const pool = new mssql.ConnectionPool(test.config);
      
      // Connect to the database with timeout
      const connectPromise = pool.connect();
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000);
      });
      
      // Wait for connection or timeout
      await Promise.race([connectPromise, timeoutPromise]);
      
      console.log('✅ Connection successful!');
      
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
      console.log('Connection closed');
      
      // If we got here, we found a working configuration
      console.log('\n✅ FOUND WORKING CONFIGURATION!');
      console.log('Use these settings for your P21 connection:');
      console.log(JSON.stringify(configCopy, null, 2));
      
      return true;
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      
      // Additional error details
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      
      if (error.originalError) {
        console.error('Original error details:');
        console.error(error.originalError.message || error.originalError);
      }
      
      // Specific error handling
      if (error.message.includes('Login failed')) {
        console.log('This appears to be an authentication issue.');
        console.log('- Check if the username and password are correct');
        console.log('- Verify the SQL Server authentication mode');
        console.log('- Check if the account is locked or disabled');
      }
      
      if (error.message.includes('connect ETIMEDOUT')) {
        console.log('Connection timed out.');
        console.log('- Check if SQL Server is configured to allow remote connections');
        console.log('- Verify firewall settings');
        console.log('- Check if SQL Server is listening on the specified port');
      }
    }
  }
  
  return false;
}

// Try to connect to master database to check server status
async function checkServerStatus() {
  console.log('\n=== Checking SQL Server Status ===');
  
  try {
    // Create a minimal configuration to connect to master
    const minimalConfig = {
      server: baseConfig.server,
      database: 'master',
      user: baseConfig.user,
      password: baseConfig.password,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        connectTimeout: 5000
      }
    };
    
    console.log('Attempting to connect to master database...');
    const pool = new mssql.ConnectionPool(minimalConfig);
    await pool.connect();
    
    console.log('✅ Connected to master database');
    
    // Check server status
    const statusResult = await pool.request().query(`
      SELECT 
        SERVERPROPERTY('ProductVersion') as version,
        SERVERPROPERTY('Edition') as edition,
        SERVERPROPERTY('IsIntegratedSecurityOnly') as windows_auth_only,
        SERVERPROPERTY('IsSingleUser') as single_user_mode
    `);
    
    if (statusResult.recordset && statusResult.recordset.length > 0) {
      const status = statusResult.recordset[0];
      
      console.log('\nSQL Server Information:');
      console.log(`Version: ${status.version}`);
      console.log(`Edition: ${status.edition}`);
      console.log(`Windows Auth Only: ${status.windows_auth_only === 1 ? 'Yes' : 'No'}`);
      console.log(`Single User Mode: ${status.single_user_mode === 1 ? 'Yes' : 'No'}`);
      
      if (status.windows_auth_only === 1) {
        console.log('\n⚠️ SQL Server is configured for Windows Authentication only');
        console.log('SQL Authentication will not work. You must use Windows Authentication.');
      }
      
      if (status.single_user_mode === 1) {
        console.log('\n⚠️ SQL Server is in single user mode');
        console.log('This can prevent new connections from being established.');
      }
    }
    
    // Check if target database exists
    const dbResult = await pool.request().query(`
      SELECT name, state_desc, user_access_desc
      FROM sys.databases
      WHERE name = '${baseConfig.database}'
    `);
    
    if (dbResult.recordset && dbResult.recordset.length > 0) {
      const dbInfo = dbResult.recordset[0];
      
      console.log(`\nDatabase '${baseConfig.database}' Information:`);
      console.log(`State: ${dbInfo.state_desc}`);
      console.log(`Access Mode: ${dbInfo.user_access_desc}`);
      
      if (dbInfo.state_desc !== 'ONLINE') {
        console.log(`\n⚠️ Database '${baseConfig.database}' is not online (${dbInfo.state_desc})`);
        console.log('This prevents connections to the database.');
      }
      
      if (dbInfo.user_access_desc !== 'MULTI_USER') {
        console.log(`\n⚠️ Database '${baseConfig.database}' is in ${dbInfo.user_access_desc} mode`);
        console.log('This can prevent new connections from being established.');
      }
    } else {
      console.log(`\n⚠️ Database '${baseConfig.database}' does not exist on the server`);
      
      // List available databases
      const allDbResult = await pool.request().query(`
        SELECT name FROM sys.databases ORDER BY name
      `);
      
      if (allDbResult.recordset && allDbResult.recordset.length > 0) {
        console.log('\nAvailable databases:');
        allDbResult.recordset.forEach(db => {
          console.log(`- ${db.name}`);
        });
      }
    }
    
    // Check login information
    try {
      const loginResult = await pool.request().query(`
        SELECT name, is_disabled, type_desc
        FROM sys.server_principals
        WHERE name = '${baseConfig.user}'
      `);
      
      if (loginResult.recordset && loginResult.recordset.length > 0) {
        const loginInfo = loginResult.recordset[0];
        
        console.log(`\nLogin '${baseConfig.user}' Information:`);
        console.log(`Type: ${loginInfo.type_desc}`);
        console.log(`Disabled: ${loginInfo.is_disabled === 1 ? 'Yes' : 'No'}`);
        
        if (loginInfo.is_disabled === 1) {
          console.log(`\n⚠️ Login '${baseConfig.user}' is disabled`);
          console.log('This prevents authentication with this account.');
        }
      } else {
        console.log(`\n⚠️ Login '${baseConfig.user}' does not exist on the server`);
      }
    } catch (loginError) {
      console.error('Error checking login information:', loginError.message);
    }
    
    // Close the connection
    await pool.close();
    
    return true;
  } catch (error) {
    console.error(`❌ Error checking server status: ${error.message}`);
    
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    return false;
  }
}

// Main function
async function main() {
  try {
    // First try to check server status
    const serverStatusChecked = await checkServerStatus();
    
    if (!serverStatusChecked) {
      console.log('\n⚠️ Could not check server status. Proceeding with connection tests...');
    }
    
    // Try different connection configurations
    const connectionSuccess = await testConnectionVariations();
    
    if (!connectionSuccess) {
      console.log('\n=== Authentication Test Summary ===');
      console.log('❌ All connection attempts failed');
      console.log('\nRecommendations:');
      console.log('1. Verify SQL Server is running and accepting connections');
      console.log('2. Ensure SQL Server is configured for Mixed Mode Authentication');
      console.log('3. Check if the SA account is enabled and has the correct password');
      console.log('4. Try using a different SQL login with appropriate permissions');
      console.log('5. Verify the target database exists and is online');
      console.log('6. Check SQL Server error logs for more information');
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  }
}

// Run the main function
main();
