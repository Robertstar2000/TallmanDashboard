// Simple P21 SQL Server Connection Test
// This script tests connection to the P21play database using SQL authentication

const sql = require('mssql');

// Configuration for SQL Server Authentication
const config = {
  server: '10.10.20.28',
  database: 'P21play',
  user: 'sa',
  password: 'Ted@Admin230',
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true,
    connectTimeout: 30000
  }
};

console.log('=== Simple P21play Connection Test ===');
console.log(`Server: ${config.server}`);
console.log(`Database: ${config.database}`);
console.log(`User: ${config.user}`);
console.log('SQL Expression: SELECT COUNT(*) as value FROM P21.dbo.oe_hdr WITH (NOLOCK)');

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

// Run the test
testConnection();
