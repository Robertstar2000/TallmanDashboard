// P21 Database Connection Fix Script
// This script demonstrates the correct way to connect to the P21Play database
// and provides a solution for the "Invalid object name 'sy_param'" error
const odbc = require('odbc');
const fs = require('fs');

async function fixP21Connection() {
  console.log('=== P21 Database Connection Fix ===');
  console.log('This script will diagnose and fix issues with the P21 database connection.');
  
  // Create a log file
  const logStream = fs.createWriteStream('./p21-connection-fix.log', {flags: 'a'});
  const log = (message) => {
    console.log(message);
    logStream.write(message + '\n');
  };
  
  // Connection parameters - use SQL authentication
  const config = {
    dsn: process.env.P21_DSN || 'P21Play',
    username: process.env.P21_USERNAME || 'SA',
    password: process.env.P21_PASSWORD || '',
    database: process.env.P21_DATABASE || 'P21Play'  // Correct database name
  };
  
  log(`\nConnection parameters:
  - DSN: ${config.dsn}
  - Username: ${config.username}
  - Database: ${config.database}
  - Authentication: SQL Server`);
  
  let connection = null;
  
  try {
    // Step 1: Connect using ODBC with SQL authentication
    log('\n=== Step 1: Establish ODBC Connection ===');
    let connectionString = `DSN=${config.dsn};`;
    
    // Add authentication details if provided
    if (config.username && config.password) {
      connectionString += `UID=${config.username};PWD=${config.password};`;
    } else {
      // Use Windows Authentication
      connectionString += 'Trusted_Connection=Yes;';
    }
    
    log(`Connection string: ${connectionString.replace(config.password, '********')}`);
    
    connection = await odbc.connect(connectionString);
    log('✅ Connection successful!');
    
    // Step 2: Check current database and switch if needed
    log('\n=== Step 2: Verify and Switch Database ===');
    const dbNameResult = await connection.query('SELECT DB_NAME() as db_name');
    const currentDb = dbNameResult[0].db_name;
    log(`Current database: ${currentDb}`);
    
    if (currentDb !== config.database) {
      log(`Switching to ${config.database} database...`);
      try {
        await connection.query(`USE ${config.database}`);
        const newDbResult = await connection.query('SELECT DB_NAME() as db_name');
        log(`Successfully switched to: ${newDbResult[0].db_name}`);
      } catch (useError) {
        log(`❌ Error switching to ${config.database} database: ${useError.message}`);
        
        // List available databases
        log('\nAvailable databases:');
        const dbsResult = await connection.query(`
          SELECT name FROM master.sys.databases 
          WHERE name LIKE '%P21%' OR name LIKE '%p21%'
          ORDER BY name
        `);
        
        dbsResult.forEach(db => {
          log(`- ${db.name}`);
        });
        
        throw new Error(`Failed to switch to ${config.database} database. Please check if it exists.`);
      }
    }
    
    // Step 3: Check if system_parameters table exists
    log('\n=== Step 3: Check System Parameters Table ===');
    const sysParamsCheckResult = await connection.query(`
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'system_parameters'
    `);
    
    if (sysParamsCheckResult[0].table_exists > 0) {
      log('✅ system_parameters table exists');
      
      // Get sample data
      const sysParamsSampleResult = await connection.query('SELECT TOP 5 * FROM system_parameters');
      log(`Found ${sysParamsSampleResult.length} rows in system_parameters table.`);
    } else {
      log('❌ system_parameters table does not exist');
      
      // List tables with similar names
      const similarTablesResult = await connection.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE '%param%' OR TABLE_NAME LIKE '%system%'
        ORDER BY TABLE_NAME
      `);
      
      log('\nTables with similar names:');
      similarTablesResult.forEach(table => {
        log(`- ${table.TABLE_NAME}`);
      });
    }
    
    // Step 4: Check if sys_params_p21 table exists
    log('\n=== Step 4: Check sys_params_p21 Table ===');
    const sysParamsP21CheckResult = await connection.query(`
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'sys_params_p21'
    `);
    
    if (sysParamsP21CheckResult[0].table_exists > 0) {
      log('✅ sys_params_p21 table exists');
      
      // Get sample data
      const sysParamsP21SampleResult = await connection.query('SELECT TOP 5 * FROM sys_params_p21');
      log(`Found ${sysParamsP21SampleResult.length} rows in sys_params_p21 table.`);
    } else {
      log('❌ sys_params_p21 table does not exist');
    }
    
    // Step 5: Check for sy_param table (the one causing the error)
    log('\n=== Step 5: Check sy_param Table ===');
    const syParamCheckResult = await connection.query(`
      SELECT COUNT(*) as table_exists 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'sy_param'
    `);
    
    if (syParamCheckResult[0].table_exists > 0) {
      log('✅ sy_param table exists');
    } else {
      log('❌ sy_param table does not exist - this is the source of the error');
      
      // List tables starting with 'sy_'
      const syTablesResult = await connection.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME LIKE 'sy_%'
        ORDER BY TABLE_NAME
      `);
      
      if (syTablesResult.length > 0) {
        log('\nTables starting with "sy_":');
        syTablesResult.forEach(table => {
          log(`- ${table.TABLE_NAME}`);
        });
      } else {
        log('No tables starting with "sy_" found.');
      }
    }
    
    // Step 6: Provide solution
    log('\n=== SOLUTION ===');
    log('Based on the database analysis, here is the solution to fix the "Invalid object name" error:');
    log('\n1. Update your connection configuration:');
    log('   - Set the default database to "P21Play" instead of "P21"');
    log('   - Use SQL Server authentication with your credentials');
    
    log('\n2. Update your SQL queries:');
    log('   - Replace references to "sy_param" with "system_parameters" or "sys_params_p21"');
    log('   - Example: Change "SELECT * FROM sy_param" to "SELECT * FROM system_parameters"');
    
    log('\n3. Ensure proper database switching:');
    log('   - Add "USE P21Play;" at the beginning of your SQL queries if needed');
    log('   - Or update your connection manager to explicitly switch to P21Play after connecting');
    
    log('\n4. Update environment variables:');
    log('   - Set P21_DATABASE=P21Play');
    log('   - Set P21_DSN=P21Play');
    log('   - Set P21_USERNAME and P21_PASSWORD for SQL authentication');
    
    log('\nThese changes will resolve the "Invalid object name \'sy_param\'" error.');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`);
    
    if (error.odbcErrors && error.odbcErrors.length > 0) {
      log('\nODBC Error Details:');
      error.odbcErrors.forEach(err => {
        log(`- Code: ${err.code}, State: ${err.state}, Message: ${err.message}`);
      });
    }
  } finally {
    // Close the connection
    if (connection) {
      try {
        await connection.close();
        log('\nConnection closed successfully.');
      } catch (closeError) {
        log(`Error closing connection: ${closeError.message}`);
      }
    }
    
    log('\nFix script completed.');
    logStream.end();
  }
}

// Run the fix script
fixP21Connection().catch(err => {
  console.error('Unhandled error:', err);
});
