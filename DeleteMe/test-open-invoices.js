const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Alternative queries for Open Invoices
const openInvoicesQueries = [
  {
    name: "Original Query",
    sql: `SELECT COUNT(*) as value 
          FROM ar_open_items WITH (NOLOCK) 
          WHERE open_closed_flag = 'O'`
  },
  {
    name: "Alternative 1",
    sql: `SELECT COUNT(*) as value 
          FROM invoice_hdr WITH (NOLOCK) 
          WHERE completed = 'N'`
  },
  {
    name: "Alternative 2",
    sql: `SELECT COUNT(*) as value 
          FROM invoice_hdr WITH (NOLOCK) 
          WHERE delete_flag = 'N'`
  },
  {
    name: "Alternative 3",
    sql: `SELECT COUNT(*) as value 
          FROM invoice_hdr WITH (NOLOCK) 
          WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
  },
  {
    name: "Alternative 4",
    sql: `SELECT COUNT(*) as value 
          FROM oe_hdr WITH (NOLOCK) 
          WHERE completed = 'N' 
          AND order_date >= DATEADD(month, -1, GETDATE())`
  },
  {
    name: "Alternative 5 (Fallback)",
    sql: `SELECT COUNT(*) as value 
          FROM oe_hdr WITH (NOLOCK) 
          WHERE completed = 'N'`
  }
];

// Function to test a query and return the result
async function testQuery(connection, query) {
  console.log(`\n=== Testing ${query.name} ===`);
  console.log(query.sql);
  
  try {
    const result = await connection.query(query.sql);
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
  console.log('=== Testing Alternative Queries for Open Invoices ===');
  console.log('Starting at', new Date().toISOString());
  
  // Create output file
  const outputFilePath = path.join(__dirname, 'open-invoices-results.txt');
  const outputStream = fs.createWriteStream(outputFilePath);
  
  outputStream.write('=== Testing Alternative Queries for Open Invoices ===\n');
  outputStream.write(`Starting at ${new Date().toISOString()}\n`);
  
  try {
    // Connect using ODBC DSN
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    outputStream.write(`Connection string: ${connectionString}\n`);
    
    console.log('Connecting to ODBC data source...');
    outputStream.write('Connecting to ODBC data source...\n');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    outputStream.write('✅ CONNECTED SUCCESSFULLY to ODBC data source!\n');
    
    // Test each query
    const results = [];
    
    for (const query of openInvoicesQueries) {
      const result = await testQuery(connection, query);
      
      // Also write to file
      outputStream.write(`\n=== Testing ${query.name} ===\n`);
      outputStream.write(`${query.sql}\n`);
      
      if (result.success) {
        outputStream.write(`✅ Query executed successfully!\n`);
        outputStream.write(`Result: ${result.value}\n`);
        outputStream.write(`Non-zero? ${result.value > 0 ? 'YES' : 'NO'}\n`);
        
        results.push({
          name: query.name,
          sql: query.sql,
          value: result.value,
          success: true
        });
      } else {
        outputStream.write(`❌ Query failed: ${result.error}\n`);
      }
    }
    
    // Print summary of successful queries
    console.log('\n=== SUMMARY OF SUCCESSFUL QUERIES ===');
    outputStream.write('\n=== SUMMARY OF SUCCESSFUL QUERIES ===\n');
    
    const successfulQueries = results.filter(r => r.success && r.value > 0);
    
    if (successfulQueries.length > 0) {
      for (const query of successfulQueries) {
        console.log(`${query.name} (Value: ${query.value}):`);
        console.log(query.sql);
        
        outputStream.write(`${query.name} (Value: ${query.value}):\n`);
        outputStream.write(`${query.sql}\n\n`);
      }
      
      // Recommend the best query
      const bestQuery = successfulQueries[0]; // Use the first successful query
      
      console.log('\n=== RECOMMENDED QUERY FOR OPEN INVOICES ===');
      console.log(bestQuery.sql);
      
      outputStream.write('\n=== RECOMMENDED QUERY FOR OPEN INVOICES ===\n');
      outputStream.write(`${bestQuery.sql}\n`);
      
      // Generate the updated key metric for initial-data.ts
      outputStream.write('\n=== UPDATED KEY METRIC FOR INITIAL-DATA.TS ===\n');
      const updatedMetric = `  {
    id: '5',
    name: "Open Invoices",
    chartName: "Key Metrics",
    variableName: "Open Invoices",
    serverName: 'P21',
    value: "${bestQuery.value}",
    chartGroup: "Metrics",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM orders",
    productionSqlExpression: "${bestQuery.sql.replace(/\n\s+/g, ' ')}",
    tableName: "oe_hdr"
  },`;
      outputStream.write(updatedMetric);
      
    } else {
      console.log('No successful queries found.');
      outputStream.write('No successful queries found.\n');
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
    outputStream.write('\n✅ Connection closed successfully\n');
    
    // Close the output stream
    outputStream.end();
    console.log(`Results written to ${outputFilePath}`);
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    outputStream.write(`\n❌ CRITICAL ERROR: ${error.message}\n`);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
      outputStream.write(`Stack trace: ${error.stack}\n`);
    }
    outputStream.end();
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
