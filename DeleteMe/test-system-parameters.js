// Test script to check the system_parameters table in P21Play
const odbc = require('odbc');

async function testSystemParameters() {
  console.log('Testing system_parameters table in P21Play database...');
  
  // Connection parameters
  const config = {
    dsn: process.env.P21_DSN || 'P21Play',
    username: process.env.P21_USERNAME || 'SA',
    password: process.env.P21_PASSWORD || '',
    database: process.env.P21_DATABASE || 'P21Play'
  };
  
  console.log(`Connection parameters:
  - DSN: ${config.dsn}
  - Username: ${config.username}
  - Database: ${config.database}
  - Authentication: ${config.username ? 'SQL Server' : 'Windows'}`);
  
  let connection = null;
  
  try {
    // ODBC connection
    console.log('\n--- Connecting to database ---');
    const connectionString = `DSN=${config.dsn};UID=${config.username};PWD=${config.password};`;
    console.log(`Connection string: ${connectionString.replace(config.password, '********')}`);
    
    connection = await odbc.connect(connectionString);
    console.log('✅ ODBC Connection successful!');
    
    // Get current database
    const dbNameResult = await connection.query('SELECT DB_NAME() as db_name');
    const currentDb = dbNameResult[0].db_name;
    console.log(`Current Database: ${currentDb}`);
    
    // Switch to P21Play database if needed
    if (currentDb !== config.database) {
      console.log(`\n--- Switching to ${config.database} database ---`);
      await connection.query(`USE ${config.database}`);
      const newDbResult = await connection.query('SELECT DB_NAME() as db_name');
      console.log(`Successfully switched to: ${newDbResult[0].db_name}`);
    }
    
    // Check if system_parameters table exists
    console.log('\n--- Checking system_parameters table ---');
    const tableCheckResult = await connection.query(`
      SELECT 
        COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'system_parameters'
    `);
    
    if (tableCheckResult[0].table_exists > 0) {
      console.log('✅ system_parameters table exists');
      
      // Get column information
      const columnsResult = await connection.query(`
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'system_parameters'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log(`\nColumns in system_parameters table (${columnsResult.length} total):`);
      columnsResult.slice(0, 10).forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
      console.log('...(more columns)');
      
      // Get row count
      const countResult = await connection.query('SELECT COUNT(*) as row_count FROM system_parameters');
      console.log(`\nTotal rows in system_parameters: ${countResult[0].row_count}`);
      
      // Sample data
      console.log('\n--- Sample data from system_parameters ---');
      const sampleResult = await connection.query('SELECT TOP 5 * FROM system_parameters');
      
      // Print first row with all columns
      if (sampleResult.length > 0) {
        console.log('\nFirst row:');
        Object.keys(sampleResult[0]).forEach(key => {
          console.log(`  ${key}: ${sampleResult[0][key]}`);
        });
      }
      
      // Check if sys_params_p21 table exists
      console.log('\n--- Checking sys_params_p21 table ---');
      const sysParamsCheckResult = await connection.query(`
        SELECT 
          COUNT(*) as table_exists 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'sys_params_p21'
      `);
      
      if (sysParamsCheckResult[0].table_exists > 0) {
        console.log('✅ sys_params_p21 table exists');
        
        // Get column information
        const sysParamsColumnsResult = await connection.query(`
          SELECT 
            COLUMN_NAME as column_name,
            DATA_TYPE as data_type
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = 'sys_params_p21'
          ORDER BY ORDINAL_POSITION
        `);
        
        console.log(`\nColumns in sys_params_p21 table (${sysParamsColumnsResult.length} total):`);
        sysParamsColumnsResult.forEach(col => {
          console.log(`- ${col.column_name}: ${col.data_type}`);
        });
        
        // Get row count
        const sysParamsCountResult = await connection.query('SELECT COUNT(*) as row_count FROM sys_params_p21');
        console.log(`\nTotal rows in sys_params_p21: ${sysParamsCountResult[0].row_count}`);
        
        // Sample data
        console.log('\n--- Sample data from sys_params_p21 ---');
        const sysParamsSampleResult = await connection.query('SELECT TOP 5 * FROM sys_params_p21');
        
        // Print first row with all columns
        if (sysParamsSampleResult.length > 0) {
          console.log('\nFirst row:');
          Object.keys(sysParamsSampleResult[0]).forEach(key => {
            console.log(`  ${key}: ${sysParamsSampleResult[0][key]}`);
          });
        }
      } else {
        console.log('❌ sys_params_p21 table does not exist');
      }
      
      // Recommendation
      console.log('\n--- RECOMMENDATION ---');
      console.log('Based on the database exploration, you should:');
      console.log('1. Use the P21Play database instead of P21');
      console.log('2. Use the system_parameters or sys_params_p21 table instead of sy_param');
      console.log('3. Update your connection manager to explicitly switch to P21Play database');
      
    } else {
      console.log('❌ system_parameters table does not exist');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
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
    
    console.log('\nTest completed.');
  }
}

// Run the test
testSystemParameters().catch(err => {
  console.error('Unhandled error in test script:', err);
});
