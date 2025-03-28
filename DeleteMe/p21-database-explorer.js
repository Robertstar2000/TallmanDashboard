// P21 Database Explorer Script
// This script helps diagnose SQL Server connection issues and explore the P21Play database structure
const odbc = require('odbc');
const fs = require('fs');

async function exploreP21Database() {
  console.log('=== P21 Database Explorer ===');
  console.log('Starting comprehensive database exploration...');
  
  // Connection parameters
  const config = {
    dsn: process.env.P21_DSN || 'P21Play',
    username: process.env.P21_USERNAME || 'SA',
    password: process.env.P21_PASSWORD || '',
    database: process.env.P21_DATABASE || 'P21Play'
  };
  
  console.log(`\nConnection parameters:
  - DSN: ${config.dsn}
  - Username: ${config.username}
  - Database: ${config.database}
  - Authentication: ${config.username ? 'SQL Server' : 'Windows'}`);
  
  let connection = null;
  let logData = [];
  
  function log(message) {
    console.log(message);
    logData.push(message);
  }
  
  try {
    // ODBC connection
    log('\n=== ESTABLISHING CONNECTION ===');
    const connectionString = `DSN=${config.dsn};UID=${config.username};PWD=${config.password};`;
    log(`Connection string: ${connectionString.replace(config.password, '********')}`);
    
    connection = await odbc.connect(connectionString);
    log('✅ ODBC Connection successful!');
    
    // Get SQL Server version
    log('\n=== SERVER INFORMATION ===');
    const versionResult = await connection.query('SELECT @@VERSION as version');
    log(`SQL Server Version: ${versionResult[0].version}`);
    
    // Get current database
    const dbNameResult = await connection.query('SELECT DB_NAME() as db_name');
    const currentDb = dbNameResult[0].db_name;
    log(`Current Database: ${currentDb}`);
    
    // Try to switch to P21Play database if not already there
    if (currentDb !== config.database) {
      log(`\n=== SWITCHING DATABASE ===`);
      log(`Switching from ${currentDb} to ${config.database}...`);
      try {
        await connection.query(`USE ${config.database}`);
        const newDbResult = await connection.query('SELECT DB_NAME() as db_name');
        log(`Successfully switched to: ${newDbResult[0].db_name}`);
      } catch (useError) {
        log(`❌ Error switching to ${config.database} database: ${useError.message}`);
        return;
      }
    }
    
    // Get database size and file information
    log('\n=== DATABASE SIZE INFORMATION ===');
    const dbSizeResult = await connection.query(`
      SELECT 
        DB_NAME() AS DatabaseName,
        CONVERT(DECIMAL(10,2), SUM(size * 8 / 1024.0)) AS SizeMB
      FROM sys.database_files
      WHERE type_desc = 'ROWS'
    `);
    log(`Database Size: ${dbSizeResult[0].SizeMB} MB`);
    
    // Get schema information
    log('\n=== SCHEMA INFORMATION ===');
    const schemaResult = await connection.query(`
      SELECT 
        s.name AS schema_name,
        COUNT(t.name) AS table_count
      FROM sys.schemas s
      LEFT JOIN sys.tables t ON s.schema_id = t.schema_id
      GROUP BY s.name
      ORDER BY table_count DESC
    `);
    
    log('Schemas in database:');
    schemaResult.forEach(schema => {
      log(`- ${schema.schema_name}: ${schema.table_count} tables`);
    });
    
    // Get table counts by type
    log('\n=== TABLE INFORMATION ===');
    const tableCountResult = await connection.query(`
      SELECT 
        table_type,
        COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES
      GROUP BY table_type
    `);
    
    log('Table types:');
    tableCountResult.forEach(type => {
      log(`- ${type.table_type}: ${type.count}`);
    });
    
    // Get top 20 largest tables
    log('\n=== LARGEST TABLES ===');
    const largeTablesResult = await connection.query(`
      SELECT TOP 20
        t.NAME AS TableName,
        s.Name AS SchemaName,
        p.rows AS RowCounts,
        CAST(ROUND((SUM(a.total_pages) * 8) / 1024.00, 2) AS NUMERIC(36, 2)) AS TotalSpaceMB
      FROM sys.tables t
      INNER JOIN sys.indexes i ON t.OBJECT_ID = i.object_id
      INNER JOIN sys.partitions p ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id
      INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE t.NAME NOT LIKE 'dt%' 
        AND t.is_ms_shipped = 0
        AND i.OBJECT_ID > 255
      GROUP BY t.Name, s.Name, p.Rows
      ORDER BY TotalSpaceMB DESC
    `);
    
    log('Top 20 largest tables:');
    largeTablesResult.forEach(table => {
      log(`- ${table.SchemaName}.${table.TableName}: ${table.TotalSpaceMB} MB (${table.RowCounts} rows)`);
    });
    
    // Find system parameter tables
    log('\n=== SYSTEM PARAMETER TABLES ===');
    const paramTablesResult = await connection.query(`
      SELECT 
        TABLE_SCHEMA as schema_name,
        TABLE_NAME as table_name,
        (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = t.TABLE_SCHEMA AND TABLE_NAME = t.TABLE_NAME) as column_count
      FROM INFORMATION_SCHEMA.TABLES t
      WHERE TABLE_NAME LIKE '%param%' OR TABLE_NAME LIKE '%system%'
      ORDER BY TABLE_NAME
    `);
    
    log('System parameter tables:');
    paramTablesResult.forEach(table => {
      log(`- ${table.schema_name}.${table.table_name} (${table.column_count} columns)`);
    });
    
    // Explore system_parameters table
    log('\n=== SYSTEM_PARAMETERS TABLE STRUCTURE ===');
    try {
      const sysParamsColumnsResult = await connection.query(`
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          CHARACTER_MAXIMUM_LENGTH as max_length
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'system_parameters'
        ORDER BY ORDINAL_POSITION
      `);
      
      log('Columns in system_parameters table:');
      sysParamsColumnsResult.forEach(col => {
        log(`- ${col.column_name}: ${col.data_type}${col.max_length ? `(${col.max_length})` : ''}`);
      });
      
      // Sample data from system_parameters
      const sysParamsSampleResult = await connection.query(`
        SELECT TOP 10 * FROM system_parameters
      `);
      
      log('\nSample data from system_parameters:');
      sysParamsSampleResult.forEach((row, index) => {
        log(`\nRow ${index + 1}:`);
        Object.keys(row).forEach(key => {
          log(`  ${key}: ${row[key]}`);
        });
      });
    } catch (sysParamsError) {
      log(`❌ Error exploring system_parameters table: ${sysParamsError.message}`);
    }
    
    // Explore sys_params_p21 table
    log('\n=== SYS_PARAMS_P21 TABLE STRUCTURE ===');
    try {
      const sysParamsP21ColumnsResult = await connection.query(`
        SELECT 
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          CHARACTER_MAXIMUM_LENGTH as max_length
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'sys_params_p21'
        ORDER BY ORDINAL_POSITION
      `);
      
      log('Columns in sys_params_p21 table:');
      sysParamsP21ColumnsResult.forEach(col => {
        log(`- ${col.column_name}: ${col.data_type}${col.max_length ? `(${col.max_length})` : ''}`);
      });
      
      // Sample data from sys_params_p21
      const sysParamsP21SampleResult = await connection.query(`
        SELECT TOP 10 * FROM sys_params_p21
      `);
      
      log('\nSample data from sys_params_p21:');
      sysParamsP21SampleResult.forEach((row, index) => {
        log(`\nRow ${index + 1}:`);
        Object.keys(row).forEach(key => {
          log(`  ${key}: ${row[key]}`);
        });
      });
    } catch (sysParamsP21Error) {
      log(`❌ Error exploring sys_params_p21 table: ${sysParamsP21Error.message}`);
    }
    
    // Search for tables similar to sy_param
    log('\n=== SEARCHING FOR SY_PARAM ALTERNATIVES ===');
    const syTablesResult = await connection.query(`
      SELECT 
        TABLE_SCHEMA as schema_name,
        TABLE_NAME as table_name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE 'sy_%'
      ORDER BY TABLE_NAME
    `);
    
    if (syTablesResult.length > 0) {
      log('Tables starting with "sy_":');
      syTablesResult.forEach(table => {
        log(`- ${table.schema_name}.${table.table_name}`);
      });
    } else {
      log('No tables starting with "sy_" found.');
    }
    
    // Write log to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = `./p21-database-exploration-${timestamp}.log`;
    fs.writeFileSync(logFilePath, logData.join('\n'));
    console.log(`\nLog file written to: ${logFilePath}`);
    
  } catch (error) {
    console.error('❌ Exploration failed with error:', error.message);
    
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
    
    console.log('\nExploration completed.');
  }
}

// Run the exploration
exploreP21Database().catch(err => {
  console.error('Unhandled error in exploration script:', err);
});
