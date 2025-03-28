const odbc = require('odbc');

async function checkSpecificTables() {
  console.log('=== P21 Specific Tables Check ===');
  console.log('Starting check at', new Date().toISOString());

  const tablesToCheck = [
    'apinv_hdr',
    'ar_receipts',
    'weboe_open_account_balance_data',
    'location'
  ];

  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');

    // Check each table
    for (const tableName of tablesToCheck) {
      console.log(`\n--- Checking table: ${tableName} ---`);
      
      try {
        // Check if table exists
        const existsQuery = `
          SELECT COUNT(*) as table_exists
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = '${tableName}'
        `;
        
        const existsResult = await connection.query(existsQuery);
        
        if (existsResult && existsResult[0].table_exists > 0) {
          console.log(`✅ Table ${tableName} exists`);
          
          // Get column information
          const columnsQuery = `
            SELECT 
              COLUMN_NAME, 
              DATA_TYPE,
              CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${tableName}'
            ORDER BY ORDINAL_POSITION
          `;
          
          const columnsResult = await connection.query(columnsQuery);
          console.log(`   Table has ${columnsResult.length} columns. First 10 columns:`);
          
          columnsResult.slice(0, 10).forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
          });
          
          // Count rows
          try {
            const countQuery = `SELECT COUNT(*) as row_count FROM dbo.${tableName} WITH (NOLOCK)`;
            const countResult = await connection.query(countQuery);
            console.log(`   Table has ${countResult[0].row_count} rows`);
          } catch (countError) {
            console.log(`   Couldn't count rows: ${countError.message}`);
          }
        } else {
          console.log(`❌ Table ${tableName} does not exist`);
        }
      } catch (error) {
        console.error(`❌ Error checking table ${tableName}:`, error.message);
      }
    }

    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }

  console.log('\n=== Check completed at', new Date().toISOString(), '===');
}

// Run the check
checkSpecificTables()
  .then(() => {
    console.log('Check completed successfully');
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });
