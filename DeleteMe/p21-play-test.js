// P21 SQL Server Connection Test with P21play database
// This script tests connection to the P21play database using SQL authentication

const sql = require('mssql');

// Get command line arguments
const args = process.argv.slice(2);
let server = '10.10.20.28';
let database = 'P21play';  // Using P21play as the database name
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

console.log('=== P21play Connection Test ===');
console.log(`Server: ${server}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);
console.log(`Port: ${port}`);
console.log('SQL Expression: SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)');

// Configuration for SQL Server Authentication
const config = {
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
};

async function testConnection() {
  try {
    console.log('Attempting to connect to P21play database...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Try a simple query to verify server connection
    const versionResult = await pool.request().query('SELECT @@VERSION as version');
    console.log('SQL Server version:');
    console.log(versionResult.recordset[0].version);
    
    // Execute the SQL expression from spreadsheet row 1
    try {
      const sqlExpression = "SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)";
      console.log(`\nExecuting SQL: ${sqlExpression}`);
      
      const result = await pool.request().query(sqlExpression);
      console.log('Query results:');
      console.log(JSON.stringify(result.recordset, null, 2));
    } catch (queryError) {
      console.error(`❌ Query failed: ${queryError.message}`);
      
      // Try to list available databases
      try {
        console.log('\nListing available databases:');
        const dbResult = await pool.request().query('SELECT name FROM sys.databases ORDER BY name');
        
        if (dbResult.recordset && dbResult.recordset.length > 0) {
          dbResult.recordset.forEach(db => {
            console.log(`- ${db.name}`);
          });
        } else {
          console.log('No databases found or no permission to view databases');
        }
      } catch (dbError) {
        console.error(`❌ Database listing error: ${dbError.message}`);
      }
    }
    
    await pool.close();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify the username and password are correct');
    console.log('2. Check if SQL Server is running and accepting connections');
    console.log('3. Verify the server name and port are correct');
    console.log('4. Check if the account is locked or disabled');
    console.log('5. Ensure the P21play database exists on the server');
    
    return false;
  }
}

// Run the test
testConnection();
