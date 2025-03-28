// Script to test different variations of the Open Invoices SQL expression
const odbc = require('odbc');

// Different variations of the Open Invoices SQL expression to test
const sqlVariations = [
  {
    name: "Original",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE delete_flag <> 'Y' AND invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    name: "Simple Count",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK)"
  },
  {
    name: "With Different Status Check",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE delete_flag = 'N'"
  },
  {
    name: "Without Status Check",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    name: "With Completed Check",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE completed = 'N'"
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

// Test a single SQL variation
async function testVariation(connection, variation) {
  console.log(`\n=== Testing ${variation.name} ===`);
  
  // Try the SQL
  const result = await executeQuery(connection, variation.sql);
  if (result && result.length > 0 && result[0].value !== null) {
    console.log(`Result: ${result[0].value}`);
    return {
      name: variation.name,
      sql: variation.sql,
      value: result[0].value,
      status: 'SUCCESS'
    };
  } else {
    console.log('Query failed or returned null');
    return {
      name: variation.name,
      sql: variation.sql,
      status: 'FAILED'
    };
  }
}

// Main function to test all variations
async function testOpenInvoices() {
  const connection = await connectToP21();
  if (!connection) {
    console.error('Failed to connect to P21 database. Exiting...');
    return;
  }
  
  const results = [];
  
  // Test each variation
  for (const variation of sqlVariations) {
    const result = await testVariation(connection, variation);
    results.push(result);
  }
  
  // Close connection
  await connection.close();
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  console.log(`${successful} variations succeeded`);
  console.log(`${failed} variations failed`);
  
  console.log('\nResults:');
  results.forEach(r => {
    console.log(`- ${r.name}: ${r.status === 'FAILED' ? 'FAILED' : r.value} (${r.status})`);
  });
  
  // Find the best working variation
  const workingVariations = results.filter(r => r.status === 'SUCCESS');
  if (workingVariations.length > 0) {
    console.log('\nBest working variation:');
    const bestVariation = workingVariations[0];
    console.log(`${bestVariation.name}: ${bestVariation.sql}`);
    console.log('Result:', bestVariation.value);
  } else {
    console.log('\nNo working variations found.');
  }
}

// Run the test
testOpenInvoices();
