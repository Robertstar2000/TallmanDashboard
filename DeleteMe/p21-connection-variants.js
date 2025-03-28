// P21 SQL Server Connection Test with Multiple Connection Methods
// This script tries various connection methods to connect to the P21 database

const sql = require('mssql');

// Get command line arguments
const args = process.argv.slice(2);
let server = '10.10.20.28';
let database = 'P21';
let user = 'sa';
let password = 'Ted@Admin230';
let port = 1433;

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') server = value;
  if (key === 'database') database = value;
  if (key === 'user') user = value;
  if (key === 'password') password = value;
  if (key === 'port') port = parseInt(value, 10);
}

console.log('=== P21 Connection Test with Multiple Methods ===');
console.log(`Server: ${server}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);
console.log(`Port: ${port}`);
console.log('SQL Expression: SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)');

// Define different connection configurations to try
const connectionConfigs = [
  {
    name: "Standard Connection",
    config: {
      server: server,
      database: database,
      user: user,
      password: password,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000
      }
    }
  },
  {
    name: "Connection with ODBC Driver",
    config: {
      server: server,
      database: database,
      user: user,
      password: password,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000,
        driver: 'ODBC Driver 17 for SQL Server'
      }
    }
  },
  {
    name: "Connection with SQL Server Native Client",
    config: {
      server: server,
      database: database,
      user: user,
      password: password,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000,
        driver: 'SQL Server Native Client 11.0'
      }
    }
  },
  {
    name: "Connection to master database first",
    config: {
      server: server,
      database: 'master',
      user: user,
      password: password,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000
      }
    }
  },
  {
    name: "Connection with TCP protocol",
    config: {
      server: `tcp:${server}`,
      database: database,
      user: user,
      password: password,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000
      }
    }
  },
  {
    name: "Connection with instance name",
    config: {
      server: `${server}\\SQLEXPRESS`,
      database: database,
      user: user,
      password: password,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000
      }
    }
  },
  {
    name: "Connection with MSSQLSERVER instance",
    config: {
      server: `${server}\\MSSQLSERVER`,
      database: database,
      user: user,
      password: password,
      options: {
        trustServerCertificate: true,
        encrypt: false,
        enableArithAbort: true,
        connectTimeout: 30000
      }
    }
  },
  {
    name: "Connection with encryption enabled",
    config: {
      server: server,
      database: database,
      user: user,
      password: password,
      port: port,
      options: {
        trustServerCertificate: true,
        encrypt: true,
        enableArithAbort: true,
        connectTimeout: 30000
      }
    }
  }
];

async function testConnection(connectionConfig) {
  try {
    console.log(`\n=== Testing: ${connectionConfig.name} ===`);
    console.log('Connection details:');
    console.log(JSON.stringify(connectionConfig.config, null, 2));
    
    const pool = new sql.ConnectionPool(connectionConfig.config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Try to execute the SQL query
    try {
      const sqlExpression = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";
      console.log(`Executing SQL: ${sqlExpression}`);
      
      const result = await pool.request().query(sqlExpression);
      console.log('Query results:');
      console.log(JSON.stringify(result.recordset, null, 2));
    } catch (queryError) {
      console.error(`❌ Query failed: ${queryError.message}`);
      
      // Try to connect to the database explicitly
      try {
        await pool.request().query(`USE [${database}]`);
        console.log(`✅ Successfully connected to '${database}' database`);
        
        // Try to list some tables
        const tablesResult = await pool.request().query(`
          SELECT TOP 5 name FROM sys.tables ORDER BY name
        `);
        
        console.log('Tables in the database:');
        if (tablesResult.recordset && tablesResult.recordset.length > 0) {
          tablesResult.recordset.forEach(table => {
            console.log(`- ${table.name}`);
          });
        } else {
          console.log('No tables found or no permission to view tables');
        }
      } catch (dbError) {
        console.error(`❌ Database access error: ${dbError.message}`);
      }
    }
    
    await pool.close();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    return false;
  }
}

async function main() {
  let success = false;
  
  for (const connectionConfig of connectionConfigs) {
    const result = await testConnection(connectionConfig);
    if (result) {
      success = true;
      console.log(`\n✅ Successfully connected using: ${connectionConfig.name}`);
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
  }
}

// Run the tests
main();
