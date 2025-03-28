const odbc = require('odbc');

async function testQuery(connection, name, query) {
  console.log(`\nTesting query for: ${name}`);
  console.log(query);
  
  try {
    const result = await connection.query(query);
    const value = result[0]?.value;
    console.log(`✅ Query executed successfully!`);
    console.log(`Result: ${value}`);
    console.log(`Non-zero? ${value > 0 ? 'YES' : 'NO'}`);
    return { success: true, value };
  } catch (error) {
    console.error(`❌ Query failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=== Testing Fixed Key Metrics SQL Queries ===');
  console.log('Starting test at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Store results for each metric
    const results = {};
    
    // 1. Total Orders (last 7 days)
    results.totalOrders = await testQuery(
      connection,
      "Total Orders (last 7 days)",
      `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
       WHERE order_date >= DATEADD(day, -7, GETDATE())`
    );
    
    // 2. Open Orders (count)
    results.openOrders = await testQuery(
      connection,
      "Open Orders (count)",
      `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
       WHERE completed = 'N'`
    );
    
    // 3. Open Orders 2 (dollar value)
    results.openOrders2 = await testQuery(
      connection,
      "Open Orders 2 (dollar value)",
      `SELECT ISNULL(SUM(l.extended_price), 0) as value 
       FROM oe_hdr h WITH (NOLOCK)
       JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
       WHERE h.completed = 'N'`
    );
    
    // 4. Daily Revenue (yesterday)
    results.dailyRevenue = await testQuery(
      connection,
      "Daily Revenue (yesterday)",
      `SELECT ISNULL(SUM(l.extended_price), 0) as value 
       FROM oe_hdr h WITH (NOLOCK)
       JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
       WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
    );
    
    // 5. Open Invoices
    results.openInvoices = await testQuery(
      connection,
      "Open Invoices",
      `SELECT COUNT(*) as value 
       FROM invoice_hdr WITH (NOLOCK) 
       WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
    );
    
    // Try alternative if the first one fails
    if (!results.openInvoices.success) {
      results.openInvoices = await testQuery(
        connection,
        "Open Invoices (alternative)",
        `SELECT COUNT(*) as value 
         FROM ar_open_items WITH (NOLOCK) 
         WHERE open_closed_flag = 'O'`
      );
    }
    
    // 6. Orders Backlogged
    results.ordersBacklogged = await testQuery(
      connection,
      "Orders Backlogged",
      `SELECT COUNT(*) as value 
       FROM oe_hdr WITH (NOLOCK) 
       WHERE completed = 'N' 
       AND order_date >= DATEADD(day, -30, GETDATE())`
    );
    
    // 7. Total Monthly Sales
    results.totalMonthlySales = await testQuery(
      connection,
      "Total Monthly Sales (last 30 days)",
      `SELECT ISNULL(SUM(l.extended_price), 0) as value 
       FROM oe_hdr h WITH (NOLOCK)
       JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
       WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
    );
    
    // Print summary of results
    console.log('\n=== SUMMARY OF RESULTS ===');
    for (const [key, result] of Object.entries(results)) {
      console.log(`${key}: ${result.success ? `SUCCESS (${result.value})` : 'FAILED'}`);
    }
    
    // Generate updated initial-data.ts content for key metrics
    console.log('\n=== UPDATED KEY METRICS SQL EXPRESSIONS ===');
    console.log('Replace the Key Metrics section in initial-data.ts with:');
    
    const keyMetrics = [
      {
        id: '1',
        name: "Total Orders",
        description: "Total number of orders in the last 7 days",
        sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
              WHERE order_date >= DATEADD(day, -7, GETDATE())`,
        value: results.totalOrders.success ? results.totalOrders.value : 0
      },
      {
        id: '2',
        name: "Open Orders",
        description: "Total number of orders that are not closed",
        sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
              WHERE completed = 'N'`,
        value: results.openOrders.success ? results.openOrders.value : 0
      },
      {
        id: '3',
        name: "Open Orders 2",
        description: "Total dollar value of all open orders",
        sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
              FROM oe_hdr h WITH (NOLOCK)
              JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
              WHERE h.completed = 'N'`,
        value: results.openOrders2.success ? results.openOrders2.value : 0
      },
      {
        id: '4',
        name: "Daily Revenue",
        description: "Total dollar value of orders shipped today",
        sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
              FROM oe_hdr h WITH (NOLOCK)
              JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
              WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`,
        value: results.dailyRevenue.success ? results.dailyRevenue.value : 0
      },
      {
        id: '5',
        name: "Open Invoices",
        description: "Total number of open invoices outstanding",
        sql: results.openInvoices.success ? 
             (results.openInvoices.query || `SELECT COUNT(*) as value 
              FROM ar_open_items WITH (NOLOCK) 
              WHERE open_closed_flag = 'O'`) : 
             `SELECT COUNT(*) as value 
              FROM ar_open_items WITH (NOLOCK) 
              WHERE open_closed_flag = 'O'`,
        value: results.openInvoices.success ? results.openInvoices.value : 0
      },
      {
        id: '6',
        name: "Orders Backlogged",
        description: "Total number of orders that are on hold or backlogged",
        sql: `SELECT COUNT(*) as value 
              FROM oe_hdr WITH (NOLOCK) 
              WHERE completed = 'N' 
              AND order_date >= DATEADD(day, -30, GETDATE())`,
        value: results.ordersBacklogged.success ? results.ordersBacklogged.value : 0
      },
      {
        id: '7',
        name: "Total Monthly Sales",
        description: "Total dollar amount of all orders for the last 30 days",
        sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
              FROM oe_hdr h WITH (NOLOCK)
              JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
              WHERE h.order_date >= DATEADD(day, -30, GETDATE())`,
        value: results.totalMonthlySales.success ? results.totalMonthlySales.value : 0
      }
    ];
    
    let updatedKeyMetrics = '// Key Metrics - These are single data points\n';
    
    for (const metric of keyMetrics) {
      updatedKeyMetrics += `  {
    id: '${metric.id}',
    name: "${metric.name}",
    chartName: "Key Metrics",
    variableName: "${metric.name}",
    serverName: 'P21',
    value: "${metric.value}",
    chartGroup: "Metrics",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM orders",
    productionSqlExpression: "${metric.sql.replace(/\n\s+/g, ' ')}",
    tableName: "oe_hdr"
  },\n`;
    }
    
    console.log(updatedKeyMetrics);
    
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
main()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error in test:', err);
    process.exit(1);
  });
