const odbc = require('odbc');

async function testFixedQuery() {
  console.log('=== Testing Fixed SQL Query ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Original failing query
    const failingQuery = `SELECT ISNULL(SUM(order_amt), 0) as value FROM oe_hdr WITH (NOLOCK) WHERE CONVERT(date, order_date) = CONVERT(date, GETDATE())`;
    console.log('\nOriginal failing query:');
    console.log(failingQuery);
    
    // Fixed query using oe_line table
    const fixedQuery = `
      SELECT ISNULL(SUM(l.extended_price), 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE CONVERT(date, h.order_date) = CONVERT(date, GETDATE())
    `;
    console.log('\nFixed query:');
    console.log(fixedQuery);
    
    // Test the fixed query
    console.log('\n--- Testing the fixed query ---');
    try {
      const result = await connection.query(fixedQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Test with a specific date to ensure we get some data
    const specificDateQuery = `
      SELECT ISNULL(SUM(l.extended_price), 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE CONVERT(date, h.order_date) = CONVERT(date, '2023-01-01')
    `;
    console.log('\n--- Testing with a specific date ---');
    try {
      const result = await connection.query(specificDateQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result for 2023-01-01:', result[0].value);
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Alternative query using invoice_hdr if available
    const invoiceQuery = `
      SELECT ISNULL(SUM(total_amount), 0) as value 
      FROM invoice_hdr WITH (NOLOCK)
      WHERE CONVERT(date, invoice_date) = CONVERT(date, GETDATE())
    `;
    console.log('\n--- Testing alternative invoice query ---');
    try {
      const result = await connection.query(invoiceQuery);
      console.log('✅ Invoice query executed successfully!');
      console.log('Result:', result[0].value);
    } catch (error) {
      console.error('❌ Invoice query failed:', error.message);
      
      // Try with a different column name
      const altInvoiceQuery = `
        SELECT ISNULL(SUM(invoice_amt), 0) as value 
        FROM invoice_hdr WITH (NOLOCK)
        WHERE CONVERT(date, invoice_date) = CONVERT(date, GETDATE())
      `;
      try {
        const altResult = await connection.query(altInvoiceQuery);
        console.log('✅ Alternative invoice query executed successfully!');
        console.log('Result:', altResult[0].value);
      } catch (altError) {
        console.error('❌ Alternative invoice query failed:', altError.message);
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
testFixedQuery()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
