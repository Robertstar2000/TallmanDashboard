const odbc = require('odbc');

async function runDiagnostics() {
  console.log('=== P21 SQL Connection Diagnostics ===');
  console.log('Starting diagnostics at', new Date().toISOString());
  
  try {
    // 1. Test basic connection using ODBC DSN
    console.log('\n--- Test 1: Basic Connection Test ---');
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // 2. Check SQL Server version
    console.log('\n--- Test 2: SQL Server Version ---');
    try {
      const versionResult = await connection.query('SELECT @@VERSION as version');
      console.log('✅ SQL Version:', versionResult[0].version);
    } catch (error) {
      console.error('❌ Error getting SQL version:', error.message);
    }
    
    // 3. Check current database context
    console.log('\n--- Test 3: Database Context ---');
    try {
      const dbResult = await connection.query('SELECT DB_NAME() as current_database');
      console.log('✅ Current database:', dbResult[0].current_database);
    } catch (error) {
      console.error('❌ Error getting current database:', error.message);
    }
    
    // 4. List all available databases
    console.log('\n--- Test 4: Available Databases ---');
    try {
      const dbListResult = await connection.query('SELECT name FROM sys.databases ORDER BY name');
      console.log('✅ Available databases:');
      dbListResult.forEach(db => console.log(`   - ${db.name}`));
    } catch (error) {
      console.error('❌ Error listing databases:', error.message);
    }
    
    // 5. Check if we can access system tables
    console.log('\n--- Test 5: System Tables Access ---');
    try {
      const sysTablesResult = await connection.query("SELECT TOP 5 name FROM sys.tables");
      console.log('✅ Can access system tables. Sample tables:');
      sysTablesResult.forEach(table => console.log(`   - ${table.name}`));
    } catch (error) {
      console.error('❌ Error accessing system tables:', error.message);
    }
    
    // 6. Try to list tables using INFORMATION_SCHEMA (more permissive)
    console.log('\n--- Test 6: INFORMATION_SCHEMA Tables ---');
    try {
      const infoSchemaResult = await connection.query(
        "SELECT TOP 10 TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"
      );
      console.log('✅ Tables from INFORMATION_SCHEMA:');
      infoSchemaResult.forEach(table => 
        console.log(`   - ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`)
      );
    } catch (error) {
      console.error('❌ Error accessing INFORMATION_SCHEMA:', error.message);
    }
    
    // 7. Check for specific tables mentioned in the dashboard queries
    console.log('\n--- Test 7: Check for Specific Tables ---');
    const tablesToCheck = [
      'oe_hdr', 'ar_open_items', 'ap_open_items', 'customer', 
      'inv_mast', 'invoice_hdr', 'order_hdr', 'location_mst'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const tableCheckResult = await connection.query(
          `SELECT CASE 
             WHEN OBJECT_ID('${tableName}') IS NOT NULL THEN 'exists' 
             WHEN OBJECT_ID('dbo.${tableName}') IS NOT NULL THEN 'exists in dbo schema'
             WHEN OBJECT_ID('P21.dbo.${tableName}') IS NOT NULL THEN 'exists in P21.dbo schema'
             ELSE 'not found' 
           END as table_status`
        );
        console.log(`   - Table ${tableName}: ${tableCheckResult[0].table_status}`);
      } catch (error) {
        console.error(`   - ❌ Error checking table ${tableName}:`, error.message);
      }
    }
    
    // 8. Try different schema prefixes for a simple query
    console.log('\n--- Test 8: Schema Prefix Tests ---');
    const schemaTests = [
      { name: 'No schema', query: 'SELECT TOP 1 * FROM oe_hdr' },
      { name: 'dbo schema', query: 'SELECT TOP 1 * FROM dbo.oe_hdr' },
      { name: 'P21.dbo schema', query: 'SELECT TOP 1 * FROM P21.dbo.oe_hdr' },
      { name: 'Database context switch', query: 'USE P21; SELECT TOP 1 * FROM dbo.oe_hdr' }
    ];
    
    for (const test of schemaTests) {
      try {
        await connection.query(test.query);
        console.log(`   - ✅ ${test.name}: SUCCESS`);
      } catch (error) {
        console.error(`   - ❌ ${test.name}: FAILED - ${error.message}`);
      }
    }
    
    // 9. Test a simple COUNT query on each table
    console.log('\n--- Test 9: Simple COUNT Queries ---');
    for (const tableName of tablesToCheck) {
      try {
        const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   - ✅ COUNT(*) from ${tableName}: ${countResult[0].count}`);
      } catch (error) {
        console.error(`   - ❌ Error counting ${tableName}:`, error.message);
      }
    }
    
    // 10. Test permissions by trying to create a temporary table
    console.log('\n--- Test 10: Permission Test ---');
    try {
      await connection.query(`
        CREATE TABLE #temp_test (id INT);
        INSERT INTO #temp_test VALUES (1);
        SELECT * FROM #temp_test;
        DROP TABLE #temp_test;
      `);
      console.log('   - ✅ Can create temporary tables');
    } catch (error) {
      console.error('   - ❌ Error creating temporary table:', error.message);
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  console.log('\n=== Diagnostics completed at', new Date().toISOString(), '===');
}

// Run the diagnostics
runDiagnostics()
  .then(() => {
    console.log('Diagnostics completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in diagnostics:', err);
    process.exit(1);
  });
