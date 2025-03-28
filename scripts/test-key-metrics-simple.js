// Script to test Key Metrics SQL expressions against P21 database
const odbc = require('odbc');
const fs = require('fs');

// Original Key Metrics SQL expressions
const keyMetricsExpressions = [
  {
    id: "117",
    name: "Total Orders",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Open' AND ORDER_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.OE_HDR"
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Open' AND ORDER_DATE = @DataPointStart",
    tableName: "dbo.OE_HDR"
  },
  {
    id: "119",
    name: "All Open Orders",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Open' AND ORDER_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.OE_HDR"
  },
  {
    id: "120",
    name: "Daily Revenue",
    originalSql: "SELECT SUM(Total) AS value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE = @DataPointStart",
    tableName: "dbo.SOMAST"
  },
  {
    id: "121",
    name: "Open Invoices",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.ARINV WITH (NOLOCK) WHERE invoice_status = 'Open' AND INVOICE_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.ARINV"
  },
  {
    id: "122",
    name: "OrdersBackloged",
    originalSql: "SELECT COUNT(*) AS value FROM dbo.OE_HDR WITH (NOLOCK) WHERE order_status = 'Backlog' AND ORDER_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.OE_HDR"
  },
  {
    id: "123",
    name: "Total Sales Monthly",
    originalSql: "SELECT (SUM(Total) - SUM(RentalTotal)) AS value FROM dbo.SOMAST WITH (NOLOCK) WHERE SO_DATE BETWEEN @DataPointStart AND @DataPointEnd",
    tableName: "dbo.SOMAST"
  }
];

// Connect to P21 database using ODBC
async function connectToP21() {
  try {
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    const connection = await odbc.connect(connectionString);
    console.log('Successfully connected to P21 database');
    return connection;
  } catch (error) {
    console.error('Error connecting to P21 database:', error);
    return null;
  }
}

// Execute SQL query
async function executeQuery(connection, sql) {
  try {
    // Replace parameters with actual dates
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30); // 30 days ago
    
    const formattedToday = today.toISOString().split('T')[0];
    const formattedStartDate = startDate.toISOString().split('T')[0];
    
    const modifiedSql = sql
      .replace(/@DataPointStart/g, `'${formattedStartDate}'`)
      .replace(/@DataPointEnd/g, `'${formattedToday}'`);
    
    console.log('Executing SQL:', modifiedSql);
    const result = await connection.query(modifiedSql);
    return result;
  } catch (error) {
    console.error('Error executing query:', error.message);
    return null;
  }
}

// Test a single metric
async function testMetric(connection, metric) {
  console.log(`\n=== Testing ${metric.name} (ID: ${metric.id}) ===`);
  
  // Try original SQL
  const result = await executeQuery(connection, metric.originalSql);
  if (result && result.length > 0 && result[0].value !== null) {
    console.log(`Result: ${result[0].value}`);
    return {
      id: metric.id,
      name: metric.name,
      sql: metric.originalSql,
      value: result[0].value,
      status: result[0].value > 0 ? 'SUCCESS' : 'ZERO'
    };
  } else {
    console.log('Query failed or returned null');
    return {
      id: metric.id,
      name: metric.name,
      sql: metric.originalSql,
      status: 'FAILED'
    };
  }
}

// Main function to test all metrics
async function testKeyMetrics() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  const results = [];
  
  // Test each metric
  for (const metric of keyMetricsExpressions) {
    const result = await testMetric(connection, metric);
    results.push(result);
  }
  
  // Close connection
  await connection.close();
  
  // Save results to file
  fs.writeFileSync('key-metrics-results.json', JSON.stringify(results, null, 2));
  console.log('\n=== Testing completed ===');
  console.log('Results saved to key-metrics-results.json');
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const zero = results.filter(r => r.status === 'ZERO').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`${successful} metrics returned non-zero values`);
  console.log(`${zero} metrics returned zero values`);
  console.log(`${failed} metrics failed to execute`);
  
  console.log('\nResults:');
  results.forEach(r => {
    console.log(`- ${r.name}: ${r.status === 'FAILED' ? 'FAILED' : r.value} (${r.status})`);
  });
}

// Run the test
testKeyMetrics();
