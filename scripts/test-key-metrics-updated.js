// Script to test Key Metrics SQL expressions against P21 database using updated schema
const odbc = require('odbc');
const fs = require('fs');

// P21 Schema (simplified version from p21-schema.ts)
const P21_SCHEMA = {
  orders: {
    table: 'dbo.oe_hdr',
    fields: {
      id: 'order_no',
      status: 'completed',
      date: 'order_date',
      delete_flag: 'delete_flag',
      completed: 'completed',
      backlog: 'cancel_flag'
    }
  },
  order_lines: {
    table: 'dbo.oe_line',
    fields: {
      order_no: 'order_no',
      extended_price: 'extended_price'
    }
  },
  invoices: {
    table: 'dbo.invoice_hdr',
    fields: {
      date: 'invoice_date',
      status: 'completed',
      delete_flag: 'delete_flag'
    }
  }
};

// Updated Key Metrics SQL expressions based on the correct schema
const keyMetricsExpressions = [
  {
    id: "117",
    name: "Total Orders",
    sql: `SELECT COUNT(*) AS value FROM ${P21_SCHEMA.orders.table} WITH (NOLOCK) 
          WHERE ${P21_SCHEMA.orders.fields.date} >= DATEADD(day, -7, GETDATE())`
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: `SELECT COUNT(*) AS value FROM ${P21_SCHEMA.orders.table} WITH (NOLOCK) 
          WHERE ${P21_SCHEMA.orders.fields.completed} = 'N'`
  },
  {
    id: "119",
    name: "All Open Orders",
    sql: `SELECT COUNT(*) AS value FROM ${P21_SCHEMA.orders.table} WITH (NOLOCK) 
          WHERE ${P21_SCHEMA.orders.fields.completed} = 'N'`
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: `SELECT ISNULL(SUM(l.${P21_SCHEMA.order_lines.fields.extended_price}), 0) AS value 
          FROM ${P21_SCHEMA.orders.table} h WITH (NOLOCK)
          JOIN ${P21_SCHEMA.order_lines.table} l WITH (NOLOCK) ON h.${P21_SCHEMA.orders.fields.id} = l.${P21_SCHEMA.order_lines.fields.order_no}
          WHERE CONVERT(date, h.${P21_SCHEMA.orders.fields.date}) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
  },
  {
    id: "121",
    name: "Open Invoices",
    sql: `SELECT COUNT(*) AS value FROM ${P21_SCHEMA.invoices.table} WITH (NOLOCK) 
          WHERE ${P21_SCHEMA.invoices.fields.date} >= DATEADD(month, -1, GETDATE())`
  },
  {
    id: "122",
    name: "OrdersBackloged",
    sql: `SELECT COUNT(*) AS value FROM ${P21_SCHEMA.orders.table} WITH (NOLOCK) 
          WHERE ${P21_SCHEMA.orders.fields.completed} = 'N' 
          AND ${P21_SCHEMA.orders.fields.date} >= DATEADD(day, -30, GETDATE())`
  },
  {
    id: "123",
    name: "Total Sales Monthly",
    sql: `SELECT ISNULL(SUM(l.${P21_SCHEMA.order_lines.fields.extended_price}), 0) AS value 
          FROM ${P21_SCHEMA.orders.table} h WITH (NOLOCK)
          JOIN ${P21_SCHEMA.order_lines.table} l WITH (NOLOCK) ON h.${P21_SCHEMA.orders.fields.id} = l.${P21_SCHEMA.order_lines.fields.order_no}
          WHERE h.${P21_SCHEMA.orders.fields.date} >= DATEADD(day, -30, GETDATE())`
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
