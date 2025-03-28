const odbc = require('odbc');

async function checkTableSchemas() {
  console.log('=== P21 Table Schema Check ===');
  console.log('Starting schema check at', new Date().toISOString());

  const tablesToCheck = [
    'oe_hdr', 
    'po_hdr', 
    'ap_inv_hdr', 
    'ar_open_invc', 
    'sy_param'
  ];

  try {
    // 1. Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');

    // 2. Loop through each table and check its schema
    for (const tableName of tablesToCheck) {
      console.log(`\n--- Checking schema for table: ${tableName} ---`);
      try {
        // Try to find the table in different schemas
        const query = `
          SELECT 
            TABLE_SCHEMA,
            TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = '${tableName}'
        `;
        const result = await connection.query(query);

        if (result && result.length > 0) {
          console.log(`✅ Table ${tableName} found in schema: ${result[0].TABLE_SCHEMA}`);
          
          // Get column information
          const columnQuery = `
            SELECT 
              COLUMN_NAME, 
              DATA_TYPE,
              CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '${tableName}'
            ORDER BY ORDINAL_POSITION
          `;
          
          const columnResult = await connection.query(columnQuery);
          console.log(`   Table has ${columnResult.length} columns. First 5 columns:`);
          
          columnResult.slice(0, 5).forEach(col => {
            console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
          });
          
        } else {
          console.log(`❌ Table ${tableName} not found in INFORMATION_SCHEMA`);
        }
      } catch (error) {
        console.error(`❌ Error checking schema for table ${tableName}:`, error.message);
      }
    }

    // 3. Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  console.log('\n=== Schema check completed at', new Date().toISOString(), '===');
}

// Run the schema check
checkTableSchemas()
  .then(() => {
    console.log('Schema check completed successfully');
  })
  .catch(error => {
    console.error('Schema check failed:', error);
    process.exit(1);
  });
