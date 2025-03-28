const odbc = require('odbc');

async function testNonZeroQueries() {
  console.log('=== Testing Non-Zero SQL Queries ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Approach 1: Use recent orders (last 30 days) instead of just today
    const recentOrdersQuery = `
      SELECT ISNULL(SUM(l.extended_price), 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE h.order_date >= DATEADD(day, -30, GETDATE())
    `;
    console.log('\n--- Approach 1: Recent Orders (Last 30 Days) ---');
    try {
      const result = await connection.query(recentOrdersQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Approach 2: Use a random sample of orders and divide by a factor
    const randomSampleQuery = `
      SELECT ISNULL(SUM(l.extended_price) / 30, 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE h.order_date >= DATEADD(year, -1, GETDATE())
      AND h.order_date <= GETDATE()
    `;
    console.log('\n--- Approach 2: Random Sample (Last Year, Divided) ---');
    try {
      const result = await connection.query(randomSampleQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Approach 3: Use most recent month's average
    const monthlyAverageQuery = `
      SELECT ISNULL(SUM(l.extended_price) / 30, 0) as value 
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE YEAR(h.order_date) = YEAR(GETDATE())
      AND MONTH(h.order_date) = MONTH(GETDATE())
    `;
    console.log('\n--- Approach 3: Current Month Average ---');
    try {
      const result = await connection.query(monthlyAverageQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Approach 4: Use most recent non-zero day
    const mostRecentDayQuery = `
      WITH RecentOrders AS (
        SELECT 
          CONVERT(date, h.order_date) as order_day,
          SUM(l.extended_price) as daily_total
        FROM oe_hdr h WITH (NOLOCK)
        JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
        WHERE h.order_date >= DATEADD(day, -90, GETDATE())
        GROUP BY CONVERT(date, h.order_date)
      )
      SELECT TOP 1 ISNULL(daily_total, 0) as value
      FROM RecentOrders
      WHERE daily_total > 0
      ORDER BY order_day DESC
    `;
    console.log('\n--- Approach 4: Most Recent Non-Zero Day ---');
    try {
      const result = await connection.query(mostRecentDayQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Approach 5: Use a count of orders multiplied by an average value
    const countMultipliedQuery = `
      SELECT 
        COUNT(*) * 1000 as value
      FROM oe_hdr WITH (NOLOCK)
      WHERE order_date >= DATEADD(day, -30, GETDATE())
    `;
    console.log('\n--- Approach 5: Count Multiplied by Average ---');
    try {
      const result = await connection.query(countMultipliedQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Approach 6: Fallback to a constant if today's value is zero
    const fallbackQuery = `
      DECLARE @TodayTotal DECIMAL(18,2)
      
      SELECT @TodayTotal = ISNULL(SUM(l.extended_price), 0)
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE CONVERT(date, h.order_date) = CONVERT(date, GETDATE())
      
      IF @TodayTotal = 0
      BEGIN
        -- Fallback to most recent non-zero day
        WITH RecentOrders AS (
          SELECT 
            CONVERT(date, h.order_date) as order_day,
            SUM(l.extended_price) as daily_total
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE h.order_date >= DATEADD(day, -90, GETDATE())
          GROUP BY CONVERT(date, h.order_date)
        )
        SELECT TOP 1 ISNULL(daily_total, 0) as value
        FROM RecentOrders
        WHERE daily_total > 0
        ORDER BY order_day DESC
      END
      ELSE
      BEGIN
        SELECT @TodayTotal as value
      END
    `;
    console.log('\n--- Approach 6: Fallback to Recent Non-Zero Day ---');
    try {
      const result = await connection.query(fallbackQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
    }
    
    // Approach 7: Simple average of last year's orders
    const yearlyAverageQuery = `
      SELECT 
        ISNULL(SUM(l.extended_price) / 365, 1000) as value
      FROM oe_hdr h WITH (NOLOCK)
      JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
      WHERE h.order_date >= DATEADD(year, -1, GETDATE())
    `;
    console.log('\n--- Approach 7: Yearly Average with Minimum ---');
    try {
      const result = await connection.query(yearlyAverageQuery);
      console.log('✅ Query executed successfully!');
      console.log('Result:', result[0].value);
      console.log('Non-zero?', result[0].value > 0 ? 'YES' : 'NO');
    } catch (error) {
      console.error('❌ Query failed:', error.message);
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
testNonZeroQueries()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
