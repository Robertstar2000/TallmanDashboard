// Specific Database Connection Test
// Tests connection to P21play on SQL01 and POR on TS03

const mssql = require('mssql');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Database configurations
const databases = [
  {
    name: 'P21play',
    server: 'SQL01',
    ip: '10.10.20.28',
    port: 1433
  },
  {
    name: 'POR',
    server: 'TS03',
    ip: '10.10.20.13',
    port: 1433 // Default port, will try others if this fails
  }
];

// Function to run PowerShell commands
async function runPowerShell(command) {
  try {
    const { stdout } = await execPromise(`powershell -Command "${command}"`);
    return stdout.trim();
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

// Function to test connection with various configurations
async function testDatabaseConnection(db) {
  console.log(`\n=== Testing connection to ${db.name} database on ${db.server} ===`);
  
  // Get current Windows user
  const currentUser = await runPowerShell('whoami');
  console.log(`Current User: ${currentUser}`);
  
  // Check if server is reachable
  const pingResult = await runPowerShell(`Test-Connection -ComputerName ${db.server} -Count 2 -Quiet`);
  
  if (pingResult === 'True') {
    console.log(`✅ ${db.server} is reachable via ping`);
  } else {
    console.log(`❌ Cannot ping ${db.server}`);
  }
  
  // Try various connection configurations
  const connectionConfigs = [
    // Windows Authentication with server name
    {
      server: db.server,
      database: db.name,
      port: db.port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 10000,
        integrated: true,
        trustedConnection: true
      }
    },
    // Windows Authentication with IP
    {
      server: db.ip,
      database: db.name,
      port: db.port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 10000,
        integrated: true,
        trustedConnection: true
      }
    },
    // SQL Authentication with SA
    {
      server: db.server,
      database: db.name,
      port: db.port,
      user: 'sa',
      password: 'Tallman2023',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 10000
      }
    },
    // SQL Authentication with SA and IP
    {
      server: db.ip,
      database: db.name,
      port: db.port,
      user: 'sa',
      password: 'Tallman2023',
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 10000
      }
    },
    // Windows Authentication with server\\instance format
    {
      server: `${db.server}\\SQLEXPRESS`,
      database: db.name,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 10000,
        integrated: true,
        trustedConnection: true
      }
    },
    // Windows Authentication with server\\instance format (MSSQLSERVER)
    {
      server: `${db.server}\\MSSQLSERVER`,
      database: db.name,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 10000,
        integrated: true,
        trustedConnection: true
      }
    }
  ];
  
  // Try connection strings
  const connectionStrings = [
    `Server=${db.server};Database=${db.name};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=10;`,
    `Server=${db.ip};Database=${db.name};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=10;`,
    `Server=${db.server};Database=${db.name};User Id=sa;Password=Tallman2023;TrustServerCertificate=True;Connection Timeout=10;`,
    `Server=${db.ip};Database=${db.name};User Id=sa;Password=Tallman2023;TrustServerCertificate=True;Connection Timeout=10;`,
    `Server=${db.server}\\SQLEXPRESS;Database=${db.name};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=10;`,
    `Server=${db.server}\\MSSQLSERVER;Database=${db.name};Trusted_Connection=True;TrustServerCertificate=True;Connection Timeout=10;`
  ];
  
  // Try each connection configuration
  console.log('\nTrying connection configurations:');
  
  for (let i = 0; i < connectionConfigs.length; i++) {
    const config = connectionConfigs[i];
    console.log(`\nConfiguration #${i+1}:`);
    console.log(JSON.stringify(config, null, 2));
    
    try {
      console.log('Attempting to connect...');
      const pool = new mssql.ConnectionPool(config);
      await pool.connect();
      
      console.log('✅ Connection successful!');
      
      // Try a simple query
      try {
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('✅ Query successful');
        console.log('SQL Server version:');
        console.log(result.recordset[0].version);
        
        // Try to list some tables
        try {
          const tablesResult = await pool.request().query(`
            SELECT TOP 5 name FROM sys.tables ORDER BY name
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
          console.error(`❌ Error listing tables: ${dbError.message}`);
        }
      } catch (queryError) {
        console.error('❌ Query failed:', queryError.message);
      }
      
      // Close the connection
      await pool.close();
      
      // If we got here, we found a working configuration
      console.log('\n✅ Found working configuration!');
      return { success: true, config };
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      
      if (error.originalError) {
        console.error('Original error details:', error.originalError.message || error.originalError);
      }
    }
  }
  
  // Try connection strings
  console.log('\nTrying connection strings:');
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const connectionString = connectionStrings[i];
    console.log(`\nConnection String #${i+1}:`);
    console.log(connectionString);
    
    try {
      console.log('Attempting to connect...');
      const pool = new mssql.ConnectionPool(connectionString);
      await pool.connect();
      
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
      
      // If we got here, we found a working connection string
      console.log('\n✅ Found working connection string!');
      return { success: true, connectionString };
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
    }
  }
  
  // If we get here, all connection attempts failed
  console.log('\n❌ All connection attempts failed');
  
  // Try to check if SQL Server is running on a different port
  if (db.name === 'POR') {
    console.log('\nTrying to find SQL Server on different ports for POR...');
    
    const alternativePorts = [1434, 2433, 4022, 5022, 14330, 14331, 14333, 14334, 1444, 8433];
    
    for (const port of alternativePorts) {
      console.log(`\nTrying port ${port}...`);
      
      const config = {
        server: db.server,
        database: db.name,
        port: port,
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          connectTimeout: 5000,
          integrated: true,
          trustedConnection: true
        }
      };
      
      try {
        const pool = new mssql.ConnectionPool(config);
        await pool.connect();
        
        console.log('✅ Connection successful!');
        await pool.close();
        
        return { success: true, config };
      } catch (error) {
        console.error(`❌ Connection failed: ${error.message}`);
      }
    }
  }
  
  return { success: false };
}

// Function to try PowerShell SQL connection
async function tryPowerShellSqlConnection(db) {
  console.log(`\n=== Trying PowerShell SQL connection to ${db.name} on ${db.server} ===`);
  
  const sqlCmd = `
    $ErrorActionPreference = "SilentlyContinue"
    try {
      $connectionString = "Server=${db.server};Database=${db.name};Integrated Security=True;TrustServerCertificate=True;Connection Timeout=10"
      $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
      $connection.Open()
      if ($connection.State -eq 'Open') {
        "✅ Connection successful!"
        $command = $connection.CreateCommand()
        $command.CommandText = "SELECT @@VERSION as Version"
        $reader = $command.ExecuteReader()
        if ($reader.Read()) {
          "SQL Server Version: " + $reader["Version"]
        }
        $reader.Close()
        $connection.Close()
        $true
      } else {
        $false
      }
    } catch {
      "❌ Connection failed: " + $_.Exception.Message
      $false
    }
  `;
  
  const result = await runPowerShell(sqlCmd);
  console.log(result);
  
  return result.includes('Connection successful');
}

// Main function
async function main() {
  console.log('=== Specific Database Connection Test ===');
  
  // Test each database
  for (const db of databases) {
    const nodeResult = await testDatabaseConnection(db);
    
    if (!nodeResult.success) {
      // Try PowerShell as a fallback
      const psResult = await tryPowerShellSqlConnection(db);
      
      if (psResult) {
        console.log(`\n✅ PowerShell connection to ${db.name} on ${db.server} was successful!`);
      } else {
        console.log(`\n❌ All connection attempts to ${db.name} on ${db.server} failed`);
        console.log('Recommendations:');
        console.log('1. Verify SQL Server is running and accepting connections');
        console.log('2. Check if your Windows account has access to the database');
        console.log('3. Verify the correct database name and server name/IP');
        console.log('4. Check firewall settings to ensure SQL Server ports are open');
        console.log('5. Consult with database administrator for assistance');
      }
    } else {
      console.log(`\n✅ Successfully connected to ${db.name} on ${db.server}!`);
      
      if (nodeResult.config) {
        console.log('Working configuration:');
        console.log(JSON.stringify(nodeResult.config, null, 2));
      } else if (nodeResult.connectionString) {
        console.log('Working connection string:');
        console.log(nodeResult.connectionString);
      }
    }
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the main function
main();
