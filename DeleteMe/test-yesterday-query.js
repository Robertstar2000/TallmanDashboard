const odbc = require('odbc');

async function testYesterdayQuery() {
  console.log('=== Testing Yesterday SQL Query ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Original failing query (using today)
    const originalQuery = `
      SELECT ISNULL(SUM(l.extended_price), 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE CONVERT(date, h.order_date) = CONVERT(date, GETDATE())
    `;
    console.log('\n--- Original Query (Today) ---');
    try {
      const result = await connection.query(originalQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Modified query using yesterday
    const yesterdayQuery = `
      SELECT ISNULL(SUM(l.extended_price), 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))
    `;
    console.log('\n--- Modified Query (Yesterday) ---');
    try {
      const result = await connection.query(yesterdayQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Check if there's data for the past week
    console.log('\n--- Checking for data in the past week ---');
    for (let daysAgo = 1; daysAgo <= 7; daysAgo++) {
      const pastDayQuery = `
        SELECT ISNULL(SUM(l.extended_price), 0) as value,
               COUNT(*) as order_count
        FROM oe_hdr h WITH (NOLOCK)
        JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
        WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -${daysAgo}, GETDATE()))
      `;
      try {
        const result = await connection.query(pastDayQuery);
        console.log(`${daysAgo} day(s) ago:`, result[0].value, `(${result[0].order_count} orders)`);
      } catch (error) {
        console.error(`❌ Query for ${daysAgo} day(s) ago failed:`, error.message);
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
testYesterdayQuery()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
