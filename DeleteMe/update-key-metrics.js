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
async function testQuery(connection, metric) {
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

// Function to update the initial-data.ts file
function updateInitialData(results) {
  const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
  
  // Read the current file
  let content = fs.readFileSync(initialDataPath, 'utf8');
  
  // Generate the updated key metrics section
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
  
  // Find the key metrics section in the file and replace it
  const keyMetricsStartPattern = /\/\/ Key Metrics - These are single data points/;
  const keyMetricsEndPattern = /\/\/ Site Distribution - 3 data points/;
  
  const startMatch = content.match(keyMetricsStartPattern);
  const endMatch = content.match(keyMetricsEndPattern);
  
  if (startMatch && endMatch) {
    const startIndex = startMatch.index;
    const endIndex = endMatch.index;
    
    // Replace the key metrics section
    const newContent = content.substring(0, startIndex) + 
                       updatedKeyMetrics + 
                       '  ' + content.substring(endIndex);
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.bak';
    fs.writeFileSync(backupPath, content);
    console.log(`\n✅ Backup created at ${backupPath}`);
    
    // Write the updated content
    fs.writeFileSync(initialDataPath, newContent);
    console.log(`\n✅ Updated ${initialDataPath} with working queries`);
    
    return true;
  } else {
    console.error(`\n❌ Could not find key metrics section in ${initialDataPath}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Testing and Updating Key Metrics SQL Queries ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    // Test each metric and store results
    const results = {};
    
    for (const metric of keyMetrics) {
      results[metric.id] = await testQuery(connection, metric);
    }
    
    // Print summary of results
    console.log('\n=== SUMMARY OF RESULTS ===');
    let allSuccessful = true;
    
    for (const metric of keyMetrics) {
      const result = results[metric.id];
      console.log(`${metric.name}: ${result.success ? `SUCCESS (${result.value})` : 'FAILED'}`);
      
      if (!result.success) {
        allSuccessful = false;
      }
    }
    
    // Update the initial-data.ts file
    if (allSuccessful) {
      console.log('\n✅ All queries executed successfully. Updating initial-data.ts...');
      updateInitialData(results);
    } else {
      console.log('\n⚠️ Some queries failed. Review the results before updating initial-data.ts.');
      console.log('To update anyway, uncomment the updateInitialData(results) line at the end of this script and run again.');
      // Uncomment the line below to force update even with failures
      // updateInitialData(results);
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
  
  console.log('\n=== Completed at', new Date().toISOString(), '===');
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
