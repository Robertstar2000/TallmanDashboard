// Script to check for local SQL Server instances and databases
const { exec } = require('child_process');
const sql = require('mssql');

console.log('=== Local SQL Server Check ===');

// Function to execute a command and return a promise
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      return resolve(stdout);
    });
  });
}

// Try to discover local SQL Server instances using PowerShell
async function checkLocalSqlInstances() {
  try {
    console.log('\nAttempting to discover local SQL Server instances...');
    const psCommand = `powershell -Command "& {$instances = [System.Data.Sql.SqlDataSourceEnumerator]::Instance.GetDataSources(); $instances | Format-Table ServerName, InstanceName -AutoSize}"`;
    const psOutput = await executeCommand(psCommand);
    console.log(psOutput);
    return psOutput;
  } catch (error) {
    console.error('Failed to discover local SQL Server instances');
    return null;
  }
}

// Check for SQL Server services running on the local machine
async function checkSqlServices() {
  try {
    console.log('\nChecking for SQL Server services running on this machine...');
    const servicesCommand = `powershell -Command "& {Get-Service | Where-Object {$_.DisplayName -like '*SQL*'} | Format-Table Name, DisplayName, Status -AutoSize}"`;
    const servicesOutput = await executeCommand(servicesCommand);
    console.log(servicesOutput);
    return servicesOutput;
  } catch (error) {
    console.error('Failed to check SQL Server services');
    return null;
  }
}

// Try to connect to local SQL Server instances and list databases
async function tryConnectLocalInstances() {
  console.log('\nAttempting to connect to local SQL Server and list databases...');
  
  // Try different connection configurations
  const connectionConfigs = [
    {
      name: "Local Default Instance with Windows Auth",
      config: {
        server: "localhost",
        database: "master",
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          connectTimeout: 5000,
          integrated: true
        }
      }
    },
    {
      name: "Local Named Instance SQLEXPRESS with Windows Auth",
      config: {
        server: "localhost\\SQLEXPRESS",
        database: "master",
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          connectTimeout: 5000,
          integrated: true
        }
      }
    },
    {
      name: "Local Default Instance with SQL Auth",
      config: {
        server: "localhost",
        database: "master",
        user: "sa",
        password: "Ted@Admin230",
        options: {
          trustServerCertificate: true,
          encrypt: false,
          enableArithAbort: true,
          connectTimeout: 5000
        }
      }
    }
  ];
  
  for (const connectionConfig of connectionConfigs) {
    try {
      console.log(`\nTrying: ${connectionConfig.name}`);
      console.log(JSON.stringify(connectionConfig.config, null, 2));
      
      const pool = new sql.ConnectionPool(connectionConfig.config);
      await pool.connect();
      
      console.log('✅ Connection successful!');
      
      // List all databases
      const dbResult = await pool.request().query(`
        SELECT name FROM sys.databases
        WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
        ORDER BY name
      `);
      
      console.log('\nDatabases found:');
      if (dbResult.recordset && dbResult.recordset.length > 0) {
        dbResult.recordset.forEach(db => {
          console.log(`- ${db.name}`);
          
          // Check if this is the P21Play database
          if (db.name.toLowerCase() === 'p21play') {
            console.log(`\n✅ P21Play database found on ${connectionConfig.config.server}!`);
          }
        });
      } else {
        console.log('No user databases found');
      }
      
      await pool.close();
    } catch (error) {
      console.error(`❌ Connection failed: ${error.message}`);
    }
  }
}

// Search for database files on disk
async function searchForDatabaseFiles() {
  try {
    console.log('\nSearching for SQL Server database files related to P21Play...');
    const searchCommand = `powershell -Command "& {Get-ChildItem -Path 'C:\\' -Recurse -ErrorAction SilentlyContinue -Include 'P21Play.mdf', 'P21*.mdf' | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize}"`;
    const searchOutput = await executeCommand(searchCommand);
    console.log(searchOutput);
    return searchOutput;
  } catch (error) {
    console.error('Failed to search for database files');
    return null;
  }
}

// Main function
async function main() {
  await checkLocalSqlInstances();
  await checkSqlServices();
  await tryConnectLocalInstances();
  await searchForDatabaseFiles();
  
  console.log('\nSearch completed. If P21Play database was not found, consider:');
  console.log('1. The database might be on a different SQL Server instance');
  console.log('2. The database might have a different name');
  console.log('3. You might need specific credentials to access it');
}

// Run the main function
main();
