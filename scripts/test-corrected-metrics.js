// Script to test corrected Key Metrics SQL expressions
const odbc = require('odbc');

// Corrected Key Metrics SQL expressions
const correctedKeyMetrics = [
  {
    id: "117",
    name: "Total Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
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
    console.log('Executing SQL:', sql);
    const result = await connection.query(sql);
    return result;
  } catch (error) {
    console.error('Error executing query:', error.message);
    return null;
  }
}

// Test a single metric
async function testMetric(connection, metric) {
  console.log(`\n=== Testing ${metric.name} (ID: ${metric.id}) ===`);
  
  // Try the SQL
  const result = await executeQuery(connection, metric.sql);
  if (result && result.length > 0 && result[0].value !== null) {
    console.log(`Result: ${result[0].value}`);
    return {
      id: metric.id,
      name: metric.name,
      sql: metric.sql,
      value: result[0].value,
      status: result[0].value > 0 ? 'SUCCESS' : 'ZERO'
    };
  } else {
    console.log('Query failed or returned null');
    return {
      id: metric.id,
      name: metric.name,
      sql: metric.sql,
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
  for (const metric of correctedKeyMetrics) {
    const result = await testMetric(connection, metric);
    results.push(result);
  }
  
  // Close connection
  await connection.close();
  
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
