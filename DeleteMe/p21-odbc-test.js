// P21 SQL Server Connection Test with ODBC Driver
// This script tests connection to the P21 database using the Microsoft ODBC Driver

const sql = require('mssql');

// Get command line arguments
const args = process.argv.slice(2);
let server = '10.10.20.28';
let database = 'P21play';
let user = 'SA';
let password = 'Ted@Admin230';
let port = 1433;
let sqlExpression = "SELECT COUNT(*) as value FROM P21play.dbo.oe_hdr WITH (NOLOCK)";

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  
  if (key === 'server') server = value;
  if (key === 'database') database = value;
  if (key === 'user') user = value;
  if (key === 'password') password = value;
  if (key === 'port') port = parseInt(value, 10);
  if (key === 'sql') sqlExpression = value;
}

console.log('=== P21 Connection Test with ODBC Driver ===');
console.log(`Server: ${server}`);
console.log(`Database: ${database}`);
console.log(`User: ${user}`);
console.log(`Port: ${port}`);
console.log(`SQL Expression: ${sqlExpression}`);
console.log('Authentication: SQL Server Authentication');
console.log('Driver: Microsoft ODBC Driver\n');

// Configuration for SQL Server Authentication with ODBC Driver
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
    connectTimeout: 30000,
    driver: 'ODBC Driver 17 for SQL Server' // Using Microsoft ODBC Driver
  }
};

async function testConnection() {
  try {
    console.log('Attempting to connect to P21 database...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    console.log('✅ Connection successful!');
    
    // Execute the SQL expression from spreadsheet row 1
    console.log(`Executing SQL: ${sqlExpression}`);
    const result = await pool.request().query(sqlExpression);
    
    console.log('\nQuery Results:');
    if (result.recordset && result.recordset.length > 0) {
      console.log(JSON.stringify(result.recordset, null, 2));
    } else {
      console.log('No results returned');
    }
    
    await pool.close();
    return true;
  } catch (error) {
    console.error(`❌ Connection or query failed: ${error.message}`);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify the username and password are correct');
    console.log('2. Check if the ODBC Driver is installed on this system');
    console.log('3. Verify the server name and port are correct');
    console.log('4. Ensure the SQL expression is valid for the target database');
    console.log('5. Check if the account has permission to execute the query');
    
    return false;
  }
}

// Run the test
testConnection();
