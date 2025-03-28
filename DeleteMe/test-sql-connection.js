// Test script to diagnose SQL Server connection issues
const odbc = require('odbc');

async function testConnection() {
  console.log('Starting SQL Server connection test...');
  
  // Connection parameters
  const config = {
    dsn: process.env.P21_DSN || 'P21Play',
    username: process.env.P21_USERNAME || 'SA',
    password: process.env.P21_PASSWORD || 'Ted@Admin230',
    server: 'SQL01', // From the ODBC DSN configuration
    database: process.env.P21_DATABASE || 'P21'
  };
  
  console.log(`Connection parameters:
  - DSN: ${config.dsn}
  - Username: ${config.username}
  - Server: ${config.server}
  - Database: ${config.database}
  - Authentication: ${config.username ? 'SQL Server' : 'Windows'}`);
  
  let connection = null;
  
  try {
    // Try ODBC connection first
    console.log('\n--- Testing ODBC Connection ---');
    const connectionString = `DSN=${config.dsn};UID=${config.username};PWD=${config.password};`;
    console.log(`Connection string: ${connectionString.replace(config.password, '********')}`);
    
    try {
      connection = await odbc.connect(connectionString);
      console.log('✅ ODBC Connection successful!');
      
      // Get server information
      const versionResult = await connection.query('SELECT @@VERSION as version');
      console.log(`SQL Server Version: ${versionResult[0].version}`);
      
      // Get current database
      const dbNameResult = await connection.query('SELECT DB_NAME() as db_name');
      const currentDb = dbNameResult[0].db_name;
      console.log(`Current Database: ${currentDb}`);
      
      // List all databases
      console.log('\n--- Listing All Databases ---');
      try {
        const dbsResult = await connection.query('SELECT name FROM master.sys.databases ORDER BY name');
        console.log('Available databases:');
        dbsResult.forEach(db => console.log(`- ${db.name}`));
      } catch (dbsError) {
        console.error('Error listing databases:', dbsError.message);
      }
      
      // Try to switch to P21 database if not already there
      if (currentDb !== config.database) {
        console.log(`\n--- Switching to ${config.database} database ---`);
        try {
          await connection.query(`USE ${config.database}`);
          const newDbResult = await connection.query('SELECT DB_NAME() as db_name');
          console.log(`Successfully switched to: ${newDbResult[0].db_name}`);
        } catch (useError) {
          console.error(`Error switching to ${config.database} database:`, useError.message);
          
          // Try to find a database with a similar name
          console.log('\n--- Searching for similar databases ---');
          try {
            const similarDbsResult = await connection.query(`
              SELECT name FROM master.sys.databases 
              WHERE name LIKE '%${config.database}%' OR name LIKE '%p21%' 
              ORDER BY name
            `);
            
            if (similarDbsResult.length > 0) {
              console.log('Found similar databases:');
              similarDbsResult.forEach(db => console.log(`- ${db.name}`));
            } else {
              console.log('No similar databases found.');
            }
          } catch (similarError) {
            console.error('Error searching for similar databases:', similarError.message);
          }
        }
      }
      
      // List tables in the current database
      console.log('\n--- Listing Tables in Current Database ---');
      try {
        const tablesResult = await connection.query(`
          SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as table_name,
            TABLE_TYPE as table_type
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        
        if (tablesResult.length > 0) {
          console.log('Tables in current database:');
          tablesResult.forEach(table => {
            console.log(`- ${table.schema_name}.${table.table_name} (${table.table_type})`);
          });
        } else {
          console.log('No tables found in the current database.');
        }
      } catch (tablesError) {
        console.error('Error listing tables:', tablesError.message);
      }
      
      // Try to find sy_param table
      console.log('\n--- Searching for sy_param table ---');
      try {
        const paramTablesResult = await connection.query(`
          SELECT 
            TABLE_SCHEMA as schema_name,
            TABLE_NAME as table_name
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME LIKE '%param%'
          ORDER BY TABLE_SCHEMA, TABLE_NAME
        `);
        
        if (paramTablesResult.length > 0) {
          console.log('Found tables with "param" in the name:');
          paramTablesResult.forEach(table => {
            console.log(`- ${table.schema_name}.${table.table_name}`);
          });
        } else {
          console.log('No tables found with "param" in the name.');
        }
      } catch (paramError) {
        console.error('Error searching for param tables:', paramError.message);
      }
      
    } catch (odbcError) {
      console.error('❌ ODBC Connection failed:', odbcError.message);
      
      if (odbcError.odbcErrors && odbcError.odbcErrors.length > 0) {
        console.error('ODBC Error Details:');
        odbcError.odbcErrors.forEach(err => {
          console.error(`- Code: ${err.code}, State: ${err.state}, Message: ${err.message}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
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
testConnection().catch(err => {
  console.error('Unhandled error in test script:', err);
});
