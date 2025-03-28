// P21 SQL Server Domain Authentication Test Script
// This script tests domain authentication options for SQL Server

// Import required modules
const mssql = require('mssql');
const { exec } = require('child_process');
const readline = require('readline');

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

// Base configuration
const baseConfig = {
  server: process.env.P21_SERVER || 'SQL01',
  database: process.env.P21_DATABASE || 'P21play',
  user: process.env.P21_USER || '',
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

// Test Windows Authentication
async function testWindowsAuth() {
  console.log('\n=== Testing Windows Authentication ===');
  
  // Get current Windows user
  const currentUser = await getCurrentWindowsUser();
  console.log(`Current Windows user: ${currentUser}`);
  
  const winConfig = {
    server: baseConfig.server,
    database: baseConfig.database,
    port: baseConfig.port,
    options: {
      ...baseConfig.options,
      trustedConnection: true,
      integrated: true
    }
  };
  
  console.log('Connection details:');
  console.log(JSON.stringify(winConfig, null, 2));
  
  try {
    console.log('Attempting to connect with Windows Authentication...');
    const pool = new mssql.ConnectionPool(winConfig);
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

// Test SQL Authentication with domain account
async function testDomainSqlAuth() {
  console.log('\n=== Testing Domain SQL Authentication ===');
  
  // Get domain and username from user if not provided
  if (!baseConfig.user || !baseConfig.user.includes('\\')) {
    console.log('Domain account should be in format DOMAIN\\username');
    
    const domain = await question('Enter domain (without \\): ');
    const username = await question('Enter username: ');
    baseConfig.user = `${domain}\\${username}`;
  }
  
  // Get password if not provided
  if (!baseConfig.password) {
    baseConfig.password = await question('Enter password: ');
  }
  
  const domainConfig = {
    ...baseConfig,
    options: {
      ...baseConfig.options
    }
  };
  
  // Log the configuration (excluding password)
  const configCopy = { ...domainConfig };
  delete configCopy.password;
  console.log('Connection details:');
  console.log(JSON.stringify(configCopy, null, 2));
  
  try {
    console.log('Attempting to connect with domain account...');
    const pool = new mssql.ConnectionPool(domainConfig);
    await pool.connect();
    
    console.log('✅ Domain account authentication successful!');
    
    // Try a simple query
    try {
      const result = await pool.request().query('SELECT @@VERSION as version');
      console.log('✅ Query successful');
      console.log('SQL Server version:');
      console.log(result.recordset[0].version);
      
      // Check if target database exists
      const dbResult = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name = '${baseConfig.database}'
      `);
      
      if (dbResult.recordset && dbResult.recordset.length > 0) {
        console.log(`\n✅ Database '${baseConfig.database}' exists`);
        
        // Try to connect to the target database
        try {
          await pool.request().query(`USE [${baseConfig.database}]`);
          console.log(`✅ Successfully connected to '${baseConfig.database}'`);
          
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
          console.error(`❌ Error connecting to '${baseConfig.database}': ${useError.message}`);
        }
      } else {
        console.error(`❌ Database '${baseConfig.database}' does not exist`);
        
        // List available databases
        const allDbResult = await pool.request().query(`
          SELECT name FROM sys.databases WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
          ORDER BY name
        `);
        
        if (allDbResult.recordset && allDbResult.recordset.length > 0) {
          console.log('\nAvailable user databases:');
          allDbResult.recordset.forEach(db => {
            console.log(`- ${db.name}`);
          });
        }
      }
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
    }
    
    // Close the connection
    await pool.close();
    
    return true;
  } catch (error) {
    console.error(`❌ Domain account authentication failed: ${error.message}`);
    
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

// Check SQL Server configuration
async function checkSqlServerConfig() {
  console.log('\n=== Checking SQL Server Configuration ===');
  
  try {
    // Get SQL Server instance name
    const instanceName = baseConfig.server.includes('\\') ? 
      baseConfig.server.split('\\')[1] : 
      'MSSQLSERVER'; // default instance
    
    console.log(`SQL Server instance: ${instanceName}`);
    
    // Check if SQL Server service is running
    exec(`sc query MSSQL$${instanceName}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error checking SQL Server service: ${error.message}`);
        
        // Try default instance
        exec('sc query MSSQLSERVER', (defaultError, defaultStdout) => {
          if (defaultError) {
            console.error('Error checking default SQL Server service');
          } else {
            console.log('SQL Server service status:');
            console.log(defaultStdout);
          }
        });
      } else {
        console.log('SQL Server service status:');
        console.log(stdout);
      }
    });
    
    return true;
  } catch (error) {
    console.error(`Error checking SQL Server configuration: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('=== P21 SQL Server Domain Authentication Test ===');
    console.log(`Server: ${baseConfig.server}`);
    console.log(`Database: ${baseConfig.database}`);
    
    // Check SQL Server configuration
    await checkSqlServerConfig();
    
    // Test Windows Authentication
    const winAuthSuccess = await testWindowsAuth();
    
    // Test domain SQL Authentication
    const domainAuthSuccess = await testDomainSqlAuth();
    
    console.log('\n=== Authentication Test Summary ===');
    console.log(`Windows Authentication: ${winAuthSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Domain SQL Authentication: ${domainAuthSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!winAuthSuccess && !domainAuthSuccess) {
      console.log('\n❌ All authentication methods failed');
      console.log('\nRecommendations:');
      console.log('1. Verify SQL Server is running and accepting connections');
      console.log('2. Check if your Windows account has access to the SQL Server');
      console.log('3. Try a different domain account with SQL Server access');
      console.log('4. Verify the target database exists and is accessible');
      console.log('5. Check SQL Server error logs for more information');
    } else {
      console.log('\n✅ Found at least one working authentication method!');
      console.log('Use the successful method in your application configuration.');
    }
  } catch (error) {
    console.error('Unhandled error:', error);
  } finally {
    // Close readline interface
    rl.close();
  }
}

// Run the main function
main();
