// P21 SQL Server Direct Connection Test
// This script uses a direct connection string format to connect to the P21 database

const sql = require('mssql');

// Get command line arguments
const args = process.argv.slice(2);
let server = '10.10.20.28';
let database = 'P21';
let user = 'sa';
let password = 'Ted@Admin230';
let port = 1433;
let instance = '';

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') server = value;
  if (key === 'database') database = value;
  if (key === 'user') user = value;
  if (key === 'password') password = value;
  if (key === 'port') port = parseInt(value, 10);
  if (key === 'instance') instance = value;
}

console.log('=== P21 Direct Connection Test ===');
console.log(`Server: ${server}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);
console.log(`Port: ${port}`);
console.log(`Instance: ${instance || 'Default'}`);
console.log('SQL Expression: SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)');

// Create connection strings to try
const connectionStrings = [
  {
    name: "Standard Connection String",
    connectionString: `Server=${server},${port};Database=${database};User Id=${user};Password=${password};Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;`
  },
  {
    name: "Connection String with Instance",
    connectionString: `Server=${server}\\${instance || 'MSSQLSERVER'};Database=${database};User Id=${user};Password=${password};Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;`
  },
  {
    name: "Connection String with TCP Protocol",
    connectionString: `Server=tcp:${server},${port};Database=${database};User Id=${user};Password=${password};Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;`
  },
  {
    name: "Connection String to Master First",
    connectionString: `Server=${server},${port};Database=master;User Id=${user};Password=${password};Encrypt=false;TrustServerCertificate=true;Connection Timeout=30;`
  },
  {
    name: "Connection String with Driver",
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${server},${port};Database=${database};Uid=${user};Pwd=${password};Encrypt=no;TrustServerCertificate=yes;Connection Timeout=30;`
  }
];

async function testConnection(connectionStringConfig) {
  try {
    console.log(`\n=== Testing: ${connectionStringConfig.name} ===`);
    console.log(`Connection String: ${connectionStringConfig.connectionString}`);
    
    await sql.connect(connectionStringConfig.connectionString);
    
    console.log('✅ Connection successful!');
    
    // Try to execute the SQL query
    try {
      const sqlExpression = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";
      console.log(`Executing SQL: ${sqlExpression}`);
      
      const result = await sql.query(sqlExpression);
      console.log('Query results:');
      console.log(JSON.stringify(result.recordset, null, 2));
    } catch (queryError) {
      console.error(`❌ Query failed: ${queryError.message}`);
      
      // If we connected to master, try to switch to the target database
      if (connectionStringConfig.connectionString.includes('Database=master')) {
        try {
          await sql.query(`USE [${database}]`);
          console.log(`✅ Successfully switched to '${database}' database`);
          
          // Try the query again
          const sqlExpression = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";
          const result = await sql.query(sqlExpression);
          console.log('Query results:');
          console.log(JSON.stringify(result.recordset, null, 2));
        } catch (dbError) {
          console.error(`❌ Database access error: ${dbError.message}`);
        }
      }
    }
    
    await sql.close();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    await sql.close();
    return false;
  }
}

async function main() {
  let success = false;
  
  for (const connectionStringConfig of connectionStrings) {
    const result = await testConnection(connectionStringConfig);
    if (result) {
      success = true;
      console.log(`\n✅ Successfully connected using: ${connectionStringConfig.name}`);
      break;
    }
  }
  
  if (!success) {
    console.log('\n❌ All connection attempts failed');
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify the username and password are correct');
    console.log('2. Check if SQL Server is running and accepting connections');
    console.log('3. Verify the server name and port are correct');
    console.log('4. Check if the account is locked or disabled');
    console.log('5. Ensure there are no firewall rules blocking the connection');
    console.log('6. Check if SQL Server is configured to allow SQL authentication');
  }
}

// Run the tests
main();
