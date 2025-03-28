// Script to test the updated Key Metrics SQL expressions against P21 database
const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Updated Key Metrics SQL expressions
const updatedKeyMetrics = [
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    id: "119",
    name: "All Open Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    id: "121",
    name: "Open Invoices",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
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
  
  console.log('Testing updated Key Metrics SQL expressions...');
  
  const results = [];
  let successful = 0;
  
  // Test each metric
  for (const metric of updatedKeyMetrics) {
    const result = await testMetric(connection, metric);
    results.push(result);
    
    if (result.status === 'SUCCESS') {
      successful++;
    }
  }
  
  // Print summary
  console.log('\n=== Test Results Summary ===');
  console.log(`${successful} out of ${updatedKeyMetrics.length} metrics returned non-zero values`);
  
  // Print detailed results
  console.log('\n=== Detailed Results ===');
  results.forEach(result => {
    console.log(`${result.id} - ${result.name}: ${result.status}${result.value ? ' (' + result.value + ')' : ''}`);
  });
  
  // Write results to file
  const resultsFile = path.join(process.cwd(), 'key-metrics-test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultsFile}`);
  
  // Close connection
  await connection.close();
  console.log('Connection closed');
}

// Run the test
testKeyMetrics();
