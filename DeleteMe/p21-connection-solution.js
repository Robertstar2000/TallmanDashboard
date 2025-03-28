// P21 Connection Solution Script
// This script demonstrates the correct way to connect to the P21Play database
const odbc = require('odbc');

async function demonstrateP21Connection() {
  console.log('=== P21 Connection Solution ===');
  
  // Connection parameters - use SQL authentication
  const config = {
    dsn: 'P21Play',
    username: 'SA',
    password: 'Ted@Admin230',
    database: 'P21Play'  // Correct database name
  };
  
  console.log(`Connection parameters:
  - DSN: ${config.dsn}
  - Username: ${config.username}
  - Database: ${config.database}
  - Authentication: SQL Server`);
  
  let connection = null;
  
  try {
    // Step 1: Connect using ODBC with SQL authentication
    console.log('\n=== Step 1: Establish ODBC Connection ===');
    const connectionString = `DSN=${config.dsn};UID=${config.username};PWD=${config.password};`;
    console.log(`Connection string: ${connectionString.replace(config.password, '********')}`);
    
    connection = await odbc.connect(connectionString);
    console.log('✅ Connection successful!');
    
    // Step 2: Check current database and switch if needed
    console.log('\n=== Step 2: Verify and Switch Database ===');
    const dbNameResult = await connection.query('SELECT DB_NAME() as db_name');
    const currentDb = dbNameResult[0].db_name;
    console.log(`Current database: ${currentDb}`);
    
    if (currentDb !== config.database) {
      console.log(`Switching to ${config.database} database...`);
      await connection.query(`USE ${config.database}`);
      const newDbResult = await connection.query('SELECT DB_NAME() as db_name');
      console.log(`Successfully switched to: ${newDbResult[0].db_name}`);
    } else {
      console.log(`Already connected to ${config.database} database.`);
    }
    
    // Step 3: Execute a simple test query
    console.log('\n=== Step 3: Execute Test Query ===');
    const testQuery = 'SELECT TOP 5 * FROM system_parameters';
    console.log(`Executing query: ${testQuery}`);
    
    const testResult = await connection.query(testQuery);
    console.log(`Query returned ${testResult.length} rows.`);
    console.log('Sample data from first row:');
    
    if (testResult.length > 0) {
      // Display a few key columns from the first row
      const firstRow = testResult[0];
      const keyColumns = ['security_active', 'comp_sec_active', 'help_directory', 'no_of_retries'];
      
      keyColumns.forEach(col => {
        if (firstRow[col] !== undefined) {
          console.log(`  ${col}: ${firstRow[col]}`);
        }
      });
    }
    
    // Step 4: Execute a query on sys_params_p21 table
    console.log('\n=== Step 4: Query sys_params_p21 Table ===');
    const sysParamsQuery = 'SELECT TOP 5 * FROM sys_params_p21';
    console.log(`Executing query: ${sysParamsQuery}`);
    
    const sysParamsResult = await connection.query(sysParamsQuery);
    console.log(`Query returned ${sysParamsResult.length} rows.`);
    
    if (sysParamsResult.length > 0) {
      // Display key columns from the first row
      const firstRow = sysParamsResult[0];
      console.log('Sample data from first row:');
      
      if (firstRow.sys_param_id !== undefined) {
        console.log(`  sys_param_id: ${firstRow.sys_param_id}`);
      }
      
      if (firstRow.sys_param_name !== undefined) {
        console.log(`  sys_param_name: ${firstRow.sys_param_name}`);
      }
      
      if (firstRow.sys_param_value !== undefined) {
        console.log(`  sys_param_value: ${firstRow.sys_param_value}`);
      }
    }
    
    // Step 5: Provide implementation guidance
    console.log('\n=== Implementation Guidance ===');
    console.log('To fix your application, make these changes:');
    console.log('1. Update connection manager to use "P21Play" as the database name');
    console.log('2. Ensure SQL Server authentication is used with username and password');
    console.log('3. Explicitly switch to P21Play database after connection with "USE P21Play"');
    console.log('4. Replace references to "sy_param" with "system_parameters" or "sys_params_p21"');
    console.log('5. Update any SQL queries to use the correct table and column names');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.odbcErrors && error.odbcErrors.length > 0) {
      console.error('ODBC Error Details:');
      error.odbcErrors.forEach(err => {
        console.error(`- Code: ${err.code}, State: ${err.state}, Message: ${err.message}`);
      });
    }
  } finally {
    // Close the connection
    if (connection) {
      try {
        await connection.close();
        console.log('\nConnection closed successfully.');
      } catch (closeError) {
        console.error('Error closing connection:', closeError.message);
      }
    }
    
    console.log('\nDemo completed.');
  }
}

// Run the demonstration
demonstrateP21Connection().catch(err => {
  console.error('Unhandled error:', err);
});
