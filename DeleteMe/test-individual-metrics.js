const odbc = require('odbc');

// Define the key metrics with their descriptions and SQL queries
const keyMetrics = [
  {
    id: '1',
    name: "Total Orders",
    description: "Total number of orders in the last 7 days",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
          WHERE order_date >= DATEADD(day, -7, GETDATE())`
  },
  {
    id: '2',
    name: "Open Orders",
    description: "Total number of orders that are not closed",
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) 
          WHERE completed = 'N'`
  },
  {
    id: '3',
    name: "Open Orders 2",
    description: "Total dollar value of all open orders",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE h.completed = 'N'`
  },
  {
    id: '4',
    name: "Daily Revenue",
    description: "Total dollar value of orders shipped today (using yesterday's data)",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
  },
  {
    id: '5',
    name: "Open Invoices",
    description: "Total number of open invoices outstanding",
    sql: `SELECT COUNT(*) as value 
          FROM ar_open_items WITH (NOLOCK) 
          WHERE open_closed_flag = 'O'`
  },
  {
    id: '6',
    name: "Orders Backlogged",
    description: "Total number of orders that are on hold or backlogged",
    sql: `SELECT COUNT(*) as value 
          FROM oe_hdr WITH (NOLOCK) 
          WHERE completed = 'N' 
          AND order_date >= DATEADD(day, -30, GETDATE())`
  },
  {
    id: '7',
    name: "Total Monthly Sales",
    description: "Total dollar amount of all orders for the last 30 days",
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM oe_hdr h WITH (NOLOCK)
          JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no
          WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
  }
];

// Function to test a single query
async function testSingleQuery(connection, metricId) {
  const metric = keyMetrics.find(m => m.id === metricId);
  if (!metric) {
    console.error(`Metric with ID ${metricId} not found`);
    return;
  }
  
  console.log(`\n=== Testing ${metric.name} (${metric.description}) ===`);
  console.log(metric.sql);
  
  try {
    const result = await connection.query(metric.sql);
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

// Main function
async function main() {
  // Get the metric ID from command line arguments
  const metricId = process.argv[2];
  if (!metricId) {
    console.error('Please provide a metric ID (1-7) as a command line argument');
    process.exit(1);
  }
  
  console.log(`=== Testing Key Metric ${metricId} ===`);
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Test the specified metric
    await testSingleQuery(connection, metricId);
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  console.log('\n=== Completed at', new Date().toISOString(), '===');
}

// Run the script
main()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
