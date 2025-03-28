// Windows Authentication Test Script for SQL Server
// This script attempts to connect using Windows Authentication only

const sql = require('mssql');

// Get command line arguments
const args = process.argv.slice(2);
let server = '10.10.20.28';
let database = 'POR';
let port = 1433;

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') server = value;
  if (key === 'database') database = value;
  if (key === 'port') port = parseInt(value, 10);
}

console.log('=== Windows Authentication Test ===');
console.log(`Server: ${server}`);
console.log(`Database: ${database}`);
console.log(`Port: ${port}`);
console.log('Authentication: Windows Authentication\n');

// Configuration for Windows Authentication
const config = {
  server: server,
  database: database,
  port: port,
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
    connectTimeout: 30000,
    integrated: true,
    trustedConnection: true
  }
};

async function testConnection() {
  try {
    console.log('Attempting to connect using Windows Authentication...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Try a simple query
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('SQL Server version:');
    console.log(result.recordset[0].version);
    
    // Try to list some tables
    try {
      const tablesResult = await pool.request().query(`
        SELECT TOP 10 name FROM sys.tables ORDER BY name
      `);
      
      console.log('\nTables in the database:');
      if (tablesResult.recordset && tablesResult.recordset.length > 0) {
        tablesResult.recordset.forEach(table => {
          console.log(`- ${table.name}`);
        });
      } else {
        console.log('No tables found or no permission to view tables');
      }
    } catch (error) {
      console.log(`Could not list tables: ${error.message}`);
    }
    
    await pool.close();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the SQL Server is configured to allow Windows Authentication');
    console.log('2. Check if your Windows account has access to the SQL Server');
    console.log('3. Verify the server name and port are correct');
    console.log('4. Check if the SQL Server Browser service is running on the server');
    console.log('5. Ensure there are no firewall rules blocking the connection');
    
    return false;
  }
}

// Run the test
testConnection();
