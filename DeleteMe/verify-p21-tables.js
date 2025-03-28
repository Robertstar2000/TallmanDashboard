const odbc = require('odbc');

async function verifyP21Tables() {
  console.log('=== P21 Table Verification ===');
  console.log('Starting verification at', new Date().toISOString());

  const tablesToCheck = [
    'oe_hdr',
    'ar_open_items',
    'ap_open_items',
    'customer',
    'inv_mast',
    'customer_mst',
    'invoice_hdr',
    'order_hdr',
    'location_mst'
  ];

  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');

    // Check each table
    console.log('\n--- Checking Tables ---');
    for (const tableName of tablesToCheck) {
      try {
        const query = `
          SELECT COUNT(*) as table_exists
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME = '${tableName}'
        `;
        const result = await connection.query(query);
        
        if (result && result[0].table_exists > 0) {
          // Table exists, try to count rows
          try {
            const countQuery = `SELECT COUNT(*) as row_count FROM dbo.${tableName} WITH (NOLOCK)`;
            const countResult = await connection.query(countQuery);
            console.log(`✅ Table ${tableName}: EXISTS with ${countResult[0].row_count} rows`);
          } catch (countError) {
            console.log(`✅ Table ${tableName}: EXISTS but couldn't count rows - ${countError.message}`);
          }
        } else {
          console.log(`❌ Table ${tableName}: NOT FOUND`);
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

  console.log('\n=== Verification completed at', new Date().toISOString(), '===');
}

// Run the verification
verifyP21Tables()
  .then(() => {
    console.log('Verification completed successfully');
  })
  .catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
