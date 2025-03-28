// Test script to connect to the P21Play database
const odbc = require('odbc');

async function testP21PlayConnection() {
  console.log('Starting P21Play database connection test...');
  
  // Connection parameters
  const config = {
    dsn: process.env.P21_DSN || 'P21Play',
    username: process.env.P21_USERNAME || 'SA',
    password: process.env.P21_PASSWORD || 'Ted@Admin230',
    database: 'P21Play' // Try P21Play instead of P21
  };
  
  console.log(`Connection parameters:
  - DSN: ${config.dsn}
  - Username: ${config.username}
  - Database: ${config.database}
  - Authentication: ${config.username ? 'SQL Server' : 'Windows'}`);
  
  let connection = null;
  
  try {
    // ODBC connection
    console.log('\n--- Testing ODBC Connection ---');
    const connectionString = `DSN=${config.dsn};UID=${config.username};PWD=${config.password};`;
    console.log(`Connection string: ${connectionString.replace(config.password, '********')}`);
    
    connection = await odbc.connect(connectionString);
    console.log('✅ ODBC Connection successful!');
    
    // Get current database
    const dbNameResult = await connection.query('SELECT DB_NAME() as db_name');
    const currentDb = dbNameResult[0].db_name;
    console.log(`Current Database: ${currentDb}`);
    
    // Try to switch to P21Play database
    console.log(`\n--- Switching to ${config.database} database ---`);
    try {
      await connection.query(`USE ${config.database}`);
      const newDbResult = await connection.query('SELECT DB_NAME() as db_name');
      console.log(`Successfully switched to: ${newDbResult[0].db_name}`);
      
      // List tables in P21Play
      console.log('\n--- Listing Tables in P21Play Database ---');
      const tablesResult = await connection.query(`
        SELECT TOP 20
          TABLE_SCHEMA as schema_name,
          TABLE_NAME as table_name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);
      
      console.log(`Found ${tablesResult.length} tables in ${config.database} database:`);
      tablesResult.forEach(table => {
        console.log(`- ${table.schema_name}.${table.table_name}`);
      });
      
      // Search for tables with 'param' in the name
      console.log('\n--- Searching for param tables ---');
      const paramTablesResult = await connection.query(`
        SELECT 
          TABLE_SCHEMA as schema_name,
          TABLE_NAME as table_name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME LIKE '%param%'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);
      
      if (paramTablesResult.length > 0) {
        console.log(`Found ${paramTablesResult.length} tables with 'param' in the name:`);
        paramTablesResult.forEach(table => {
          console.log(`- ${table.schema_name}.${table.table_name}`);
        });
      } else {
        console.log('No tables found with "param" in the name.');
      }
      
      // Try to find sy_param specifically
      console.log('\n--- Looking for sy_param table ---');
      const syParamResult = await connection.query(`
        SELECT 
          TABLE_SCHEMA as schema_name,
          TABLE_NAME as table_name
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_NAME LIKE '%sy%param%' OR TABLE_NAME = 'sy_param'
        ORDER BY TABLE_SCHEMA, TABLE_NAME
      `);
      
      if (syParamResult.length > 0) {
        console.log(`Found ${syParamResult.length} potential sy_param tables:`);
        syParamResult.forEach(table => {
          console.log(`- ${table.schema_name}.${table.table_name}`);
        });
      } else {
        console.log('No sy_param table found. Searching for similar tables...');
        
        // Look for tables starting with 'sy_'
        const syTablesResult = await connection.query(`
          SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as table_name
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME LIKE 'sy_%'
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        
        if (syTablesResult.length > 0) {
          console.log(`Found ${syTablesResult.length} tables starting with 'sy_':`);
          syTablesResult.forEach(table => {
            console.log(`- ${table.schema_name}.${table.table_name}`);
          });
        } else {
          console.log('No tables starting with "sy_" found.');
        }
      }
      
    } catch (useError) {
      console.error(`Error switching to ${config.database} database:`, useError.message);
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
testP21PlayConnection().catch(err => {
  console.error('Unhandled error in test script:', err);
});
