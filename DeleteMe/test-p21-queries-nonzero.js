const odbc = require('odbc');

async function testQueriesForNonZeroValues() {
  console.log('=== P21 SQL Query Non-Zero Value Test ===');
  console.log('Starting test at', new Date().toISOString());

  // Define specific queries to test
  const queriesToTest = [
    {
      name: "Accounts - Payable - Month 1",
      tableName: "apinv_hdr",
      sqlQuery: "SELECT ISNULL(SUM(invoice_amount - check_amount), 0) AS value FROM dbo.apinv_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND invoice_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)"
    },
    {
      name: "Accounts - Receivable - Month 1",
      tableName: "ar_receipts",
      sqlQuery: "SELECT ISNULL(SUM(amount), 0) AS value FROM dbo.ar_receipts WITH (NOLOCK) WHERE date_received >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND date_received < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)"
    },
    {
      name: "AR Aging - Current",
      tableName: "weboe_open_account_balance_data",
      sqlQuery: "SELECT ISNULL(SUM(total_amount), 0) as value FROM dbo.weboe_open_account_balance_data WITH (NOLOCK) WHERE DATEDIFF(day, due_date, GETDATE()) <= 0"
    },
    {
      name: "Orders - New - Month 1",
      tableName: "oe_hdr",
      sqlQuery: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) AND order_date < DATEADD(month, DATEDIFF(month, 0, GETDATE()) + 1, 0)"
    },
    {
      name: "Inventory - Total Items",
      tableName: "inv_mast",
      sqlQuery: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.inv_mast WITH (NOLOCK) WHERE delete_flag <> 'Y'"
    },
    {
      name: "Customers - Total",
      tableName: "customer",
      sqlQuery: "SELECT ISNULL(COUNT(*), 0) as value FROM dbo.customer WITH (NOLOCK)"
    }
  ];

  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');

    // Test each query
    for (const queryItem of queriesToTest) {
      console.log(`\n--- Testing query for: ${queryItem.name} ---`);
      console.log(`Table: ${queryItem.tableName}`);
      
      try {
        console.log('SQL Query:', queryItem.sqlQuery);
        
        // Execute the query
        const result = await connection.query(queryItem.sqlQuery);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully');
          console.log('Result:', result[0]);
          
          // Check if value is non-zero
          const value = result[0].value;
          if (value && value !== 0) {
            console.log('✅ RETURNED NON-ZERO VALUE: ' + value);
          } else {
            console.log('⚠️ WARNING: Returned zero value');
          }
        } else {
          console.log('✅ Query executed successfully but returned no results');
        }
      } catch (error) {
        console.error(`❌ Error executing query: ${error.message}`);
        
        // Try to provide more details about the error
        if (error.message.includes('Invalid column name')) {
          console.log('This appears to be a column name error. Please check the column names in the query.');
        } else if (error.message.includes('Invalid object name')) {
          console.log('This appears to be a table name error. Please check the table name in the query.');
        } else if (error.message.includes('syntax error')) {
          console.log('This appears to be a SQL syntax error. Please check the query syntax.');
        }
      }
    }

    // Close the connection
    await connection.close();
    console.log('\n✅ Connection closed successfully');
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }

  console.log('\n=== Test completed at', new Date().toISOString(), '===');
}

// Run the test
testQueriesForNonZeroValues()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
