const odbc = require('odbc');

async function findRelatedTables() {
  console.log('=== P21 Related Tables Search ===');
  console.log('Starting search at', new Date().toISOString());

  const searchPatterns = [
    'ar_%', // Accounts receivable tables
    'ap_%', // Accounts payable tables
    '%open%', // Tables with "open" in the name
    '%location%', // Location-related tables
    '%order%' // Order-related tables
  ];

  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');

    // Search for tables matching each pattern
    for (const pattern of searchPatterns) {
      console.log(`\n--- Searching for tables matching: ${pattern} ---`);
      
      try {
        const query = `
          SELECT TABLE_NAME
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_NAME LIKE '${pattern}'
          AND TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME
        `;
        
        const result = await connection.query(query);
        
        if (result && result.length > 0) {
          console.log(`Found ${result.length} tables:`);
          result.forEach(row => {
            console.log(`- ${row.TABLE_NAME}`);
          });
        } else {
          console.log(`No tables found matching pattern: ${pattern}`);
        }
      } catch (error) {
        console.error(`Error searching for pattern ${pattern}:`, error.message);
      }
    }

    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }

  console.log('\n=== Search completed at', new Date().toISOString(), '===');
}

// Run the search
findRelatedTables()
  .then(() => {
    console.log('Search completed successfully');
  })
  .catch(error => {
    console.error('Search failed:', error);
    process.exit(1);
  });
