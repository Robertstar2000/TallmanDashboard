/**
 * Test script to verify dashboard queries
 * This script tests each of the dashboard metric queries with proper date filters
 */

const odbc = require('odbc');

async function testDashboardQueries() {
  console.log('=== Dashboard Queries Test ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect to P21 database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Test each dashboard query
    const queries = [
      {
        name: '1. Total Orders (Last 7 Days)',
        sql: `SELECT COUNT(*) as value 
              FROM dbo.oe_hdr WITH (NOLOCK) 
              WHERE order_date >= DATEADD(day, -7, GETDATE())`
      },
      {
        name: '2. Open Orders',
        sql: `SELECT COUNT(*) as value 
              FROM dbo.oe_hdr WITH (NOLOCK) 
              WHERE completed = 'N'`
      },
      {
        name: '3. Open Orders Value',
        sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
              FROM dbo.oe_hdr h WITH (NOLOCK)
              JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
              WHERE h.completed = 'N'`
      },
      {
        name: '4. Daily Revenue',
        sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
              FROM dbo.oe_hdr h WITH (NOLOCK)
              JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
              WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
      },
      {
        name: '5. Open Invoices',
        sql: `SELECT COUNT(*) as value 
              FROM dbo.invoice_hdr WITH (NOLOCK) 
              WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
      },
      {
        name: '6. Orders Backlogged',
        sql: `SELECT COUNT(*) as value 
              FROM dbo.oe_hdr WITH (NOLOCK) 
              WHERE completed = 'N' 
              AND order_date >= DATEADD(day, -30, GETDATE())`
      },
      {
        name: '7. Total Monthly Sales',
        sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
              FROM dbo.oe_hdr h WITH (NOLOCK)
              JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
              WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
      }
    ];
    
    // Add a test for total count of oe_hdr to compare
    queries.push({
      name: '8. Total Count of oe_hdr (ALL RECORDS)',
      sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)`
    });
    
    // Add a test with explicit date range for comparison
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const formattedToday = today.toISOString().split('T')[0];
    const formattedSevenDaysAgo = sevenDaysAgo.toISOString().split('T')[0];
    
    queries.push({
      name: '9. Total Orders (Last 7 Days - Explicit Dates)',
      sql: `SELECT COUNT(*) as value 
            FROM dbo.oe_hdr WITH (NOLOCK) 
            WHERE order_date >= '${formattedSevenDaysAgo}' 
            AND order_date <= '${formattedToday}'`
    });
    
    // Execute each query and log results
    for (const query of queries) {
      console.log(`\n--- Testing: ${query.name} ---`);
      console.log(`SQL: ${query.sql}`);
      
      try {
        const result = await connection.query(query.sql);
        
        if (Array.isArray(result) && result.length > 0) {
          console.log(`✅ Result: ${JSON.stringify(result[0])}`);
          
          if ('value' in result[0]) {
            console.log(`Value: ${result[0].value}`);
          } else {
            const firstKey = Object.keys(result[0])[0];
            console.log(`First column (${firstKey}): ${result[0][firstKey]}`);
          }
        } else {
          console.log(`❌ No results or unexpected format: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        console.error(`❌ Error executing query: ${error.message}`);
      }
    }
    
    // Test a query with date debugging
    console.log('\n--- Date Format Testing ---');
    try {
      const dateResult = await connection.query(`
        SELECT 
          GETDATE() as current_date,
          DATEADD(day, -7, GETDATE()) as seven_days_ago,
          CONVERT(date, GETDATE()) as current_date_only,
          CONVERT(date, DATEADD(day, -7, GETDATE())) as seven_days_ago_only
      `);
      
      console.log('Date formats:', JSON.stringify(dateResult[0]));
    } catch (error) {
      console.error('Error testing date formats:', error.message);
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
testDashboardQueries().catch(error => {
  console.error('Error running test:', error);
});
