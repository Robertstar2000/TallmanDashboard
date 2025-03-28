const odbc = require('odbc');

/**
 * Script to test the updated AR Aging queries using ar_open_items table
 */
async function testArAgingQueries() {
  console.log('=== Testing Updated AR Aging Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21');
    
    // Define the updated AR Aging queries
    const arAgingQueries = [
      {
        bucket: 'Current',
        query: "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) <= 0"
      },
      {
        bucket: '1-30 Days',
        query: "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) BETWEEN 1 AND 30"
      },
      {
        bucket: '31-60 Days',
        query: "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) BETWEEN 31 AND 60"
      },
      {
        bucket: '61-90 Days',
        query: "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) BETWEEN 61 AND 90"
      },
      {
        bucket: '90+ Days',
        query: "SELECT ISNULL(SUM(amount_remaining), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE amount_remaining > 0 AND DATEDIFF(day, due_date, GETDATE()) > 90"
      }
    ];
    
    // Check if ar_open_items table exists and has data
    console.log('\n--- Checking ar_open_items table ---');
    
    const tableCheckQuery = `
      SELECT 
        TABLE_SCHEMA,
        TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE 
        TABLE_NAME = 'ar_open_items'
      ORDER BY TABLE_SCHEMA, TABLE_NAME
    `;
    
    const tableCheck = await connection.query(tableCheckQuery);
    
    if (tableCheck.length > 0) {
      console.log(`✅ Table exists in schema: ${tableCheck[0].TABLE_SCHEMA}`);
      
      // Check columns in this table
      const columnsQuery = `
        SELECT 
          COLUMN_NAME, 
          DATA_TYPE,
          CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = '${tableCheck[0].TABLE_SCHEMA}' 
          AND TABLE_NAME = 'ar_open_items'
          AND COLUMN_NAME IN ('amount_remaining', 'due_date')
        ORDER BY ORDINAL_POSITION
      `;
      
      const columns = await connection.query(columnsQuery);
      console.log(`Found ${columns.length} required columns:`);
      columns.forEach(col => {
        console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''})`);
      });
      
      // Check if the table has data
      const countQuery = `
        SELECT COUNT(*) as row_count
        FROM ${tableCheck[0].TABLE_SCHEMA}.ar_open_items
        WHERE amount_remaining > 0
      `;
      
      const countResult = await connection.query(countQuery);
      console.log(`Table has ${countResult[0].row_count} rows with amount_remaining > 0`);
      
      if (countResult[0].row_count > 0) {
        // Get a sample of data
        const sampleQuery = `
          SELECT TOP 5 
            invoice_no, 
            amount_remaining, 
            due_date, 
            DATEDIFF(day, due_date, GETDATE()) as days_past_due
          FROM ${tableCheck[0].TABLE_SCHEMA}.ar_open_items
          WHERE amount_remaining > 0
          ORDER BY DATEDIFF(day, due_date, GETDATE())
        `;
        
        const sampleData = await connection.query(sampleQuery);
        console.log('Sample data:');
        sampleData.forEach((row, index) => {
          console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
        });
        
        // Execute each AR Aging query
        console.log('\n--- Testing AR Aging Queries ---');
        
        for (const queryInfo of arAgingQueries) {
          console.log(`\nTesting query for ${queryInfo.bucket}:`);
          console.log(queryInfo.query);
          
          try {
            const result = await connection.query(queryInfo.query);
            console.log(`✅ Query successful! Result:`, result[0].value);
          } catch (queryError) {
            console.error(`❌ Query failed: ${queryError.message}`);
          }
        }
      } else {
        console.log('⚠️ Table exists but contains no data with amount_remaining > 0');
      }
    } else {
      console.log('❌ Table does not exist');
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== AR Aging Queries Test Completed ===');
}

// Run the test
testArAgingQueries()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
