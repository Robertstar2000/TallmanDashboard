const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

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

// Function to test a query and return the result
async function testQuery(connection, metric, outputStream) {
  outputStream.write(`\n=== Testing ${metric.name} (${metric.description}) ===\n`);
  outputStream.write(`${metric.sql}\n`);
  
  try {
    const result = await connection.query(metric.sql);
    const value = result[0]?.value;
    outputStream.write(`✅ Query executed successfully!\n`);
    outputStream.write(`Result: ${value}\n`);
    outputStream.write(`Non-zero? ${value > 0 ? 'YES' : 'NO'}\n`);
    return { success: true, value };
  } catch (error) {
    outputStream.write(`❌ Query failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

// Function to generate the updated key metrics section for initial-data.ts
function generateKeyMetricsSection(results) {
  let updatedKeyMetrics = '// Key Metrics - These are single data points\n';
  
  for (const metric of keyMetrics) {
    const result = results[metric.id];
    updatedKeyMetrics += `  {
    id: '${metric.id}',
    name: "${metric.name}",
    chartName: "Key Metrics",
    variableName: "${metric.name}",
    serverName: 'P21',
    value: "${result.success ? result.value : '0'}",
    chartGroup: "Metrics",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM orders",
    productionSqlExpression: "${metric.sql.replace(/\n\s+/g, ' ')}",
    tableName: "oe_hdr"
  },\n`;
  }
  
  return updatedKeyMetrics;
}

// Main function
async function main() {
  // Create output file
  const outputFilePath = path.join(__dirname, 'key-metrics-results.txt');
  const outputStream = fs.createWriteStream(outputFilePath);
  
  outputStream.write('=== Testing Key Metrics SQL Queries ===\n');
  outputStream.write(`Starting at ${new Date().toISOString()}\n`);
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    outputStream.write(`Connection string: ${connectionString}\n`);
    
    outputStream.write('Connecting to ODBC data source...\n');
    const connection = await odbc.connect(connectionString);
    outputStream.write('✅ CONNECTED SUCCESSFULLY to ODBC data source!\n');
    
    // Test each metric and store results
    const results = {};
    
    for (const metric of keyMetrics) {
      results[metric.id] = await testQuery(connection, metric, outputStream);
    }
    
    // Print summary of results
    outputStream.write('\n=== SUMMARY OF RESULTS ===\n');
    let allSuccessful = true;
    
    for (const metric of keyMetrics) {
      const result = results[metric.id];
      outputStream.write(`${metric.name}: ${result.success ? `SUCCESS (${result.value})` : 'FAILED'}\n`);
      
      if (!result.success) {
        allSuccessful = false;
      }
    }
    
    // Generate the updated key metrics section
    const updatedKeyMetrics = generateKeyMetricsSection(results);
    outputStream.write('\n=== UPDATED KEY METRICS SECTION FOR INITIAL-DATA.TS ===\n');
    outputStream.write(updatedKeyMetrics);
    
    // Close the connection
    await connection.close();
    outputStream.write('\n✅ Connection closed successfully\n');
    
    // Close the output stream
    outputStream.end();
    console.log(`Results written to ${outputFilePath}`);
    
  } catch (error) {
    outputStream.write(`\n❌ CRITICAL ERROR: ${error.message}\n`);
    if (error.stack) {
      outputStream.write(`Stack trace: ${error.stack}\n`);
    }
    outputStream.end();
    console.error(`Error occurred. Results written to ${outputFilePath}`);
  }
}

// Run the script
main()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
