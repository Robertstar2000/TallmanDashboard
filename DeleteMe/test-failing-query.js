const odbc = require('odbc');

async function testFailingQuery() {
  console.log('=== Testing Failing SQL Query ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Test the failing query
    console.log('\n--- Testing the failing query ---');
    const failingQuery = `SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())`;
    console.log('Query:', failingQuery);
    
    try {
      const result = await connection.query(failingQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result);
    } catch (error) {
      console.error('❌ Query failed:', error.message);
      
      // Let's check the table structure to see if the columns exist
      console.log('\n--- Checking oe_hdr table structure ---');
      try {
        const tableInfo = await connection.query(`
          SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'oe_hdr'
        `);
        console.log('Table columns:');
        tableInfo.forEach(col => console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}`));
      } catch (tableError) {
        console.error('❌ Error getting table structure:', tableError.message);
      }
      
      // Try alternative queries to see what works
      console.log('\n--- Testing alternative queries ---');
      
      // Test 1: Check if table exists
      try {
        const tableCheck = await connection.query(`SELECT TOP 1 * FROM oe_hdr`);
        console.log('✅ Table exists and can be queried');
      } catch (e) {
        console.error('❌ Cannot query table:', e.message);
      }
      
      // Test 2: Try with different schema
      try {
        const schemaTest = await connection.query(`SELECT TOP 1 * FROM dbo.oe_hdr`);
        console.log('✅ Table exists in dbo schema');
      } catch (e) {
        console.error('❌ Table not in dbo schema:', e.message);
      }
      
      // Test 3: Check if order_amt column exists
      try {
        const colTest = await connection.query(`SELECT TOP 1 order_amt FROM oe_hdr`);
        console.log('✅ order_amt column exists');
      } catch (e) {
        console.error('❌ order_amt column issue:', e.message);
      }
      
      // Test 4: Check if order_date column exists
      try {
        const dateColTest = await connection.query(`SELECT TOP 1 order_date FROM oe_hdr`);
        console.log('✅ order_date column exists');
      } catch (e) {
        console.error('❌ order_date column issue:', e.message);
      }
      
      // Test 5: Try without the CONVERT function
      try {
        const noConvertTest = await connection.query(`SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK)`);
        console.log('✅ Query works without the CONVERT function');
      } catch (e) {
        console.error('❌ Issue not related to CONVERT:', e.message);
      }
      
      // Test 6: Try with a different date comparison
      try {
        const altDateTest = await connection.query(`
          SELECT ISNULL(SUM(order_amt), 0) as value 
          FROM oe_hdr WITH (NOLOCK) 
          WHERE CAST(order_date AS date) = CAST(GETDATE() AS date)
        `);
        console.log('✅ Query works with CAST instead of CONVERT');
      } catch (e) {
        console.error('❌ CAST also fails:', e.message);
      }
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
  
  console.log('\n=== Test completed at', new Date().toISOString(), '===');
}

// Run the test
testFailingQuery()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
