const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Output file path
const outputFilePath = path.join(__dirname, 'vendor-query-results.txt');

// Function to write to the output file
function writeToFile(message) {
  fs.appendFileSync(outputFilePath, message + '\n');
  console.log(message);
}

async function testQuery(connection, queryItem) {
  return new Promise(async (resolve) => {
    writeToFile(`\n=== Testing query for: ${queryItem.name} ===`);
    writeToFile(`Table: ${queryItem.tableName}`);
    writeToFile(`SQL Query: ${queryItem.sqlQuery}`);
    
    try {
      // Execute the query
      const result = await connection.query(queryItem.sqlQuery);
      
      if (result && result.length > 0) {
        writeToFile('✅ Query executed successfully');
        writeToFile(`Result: ${JSON.stringify(result[0])}`);
        
        // Check if value is non-zero
        const value = result[0].value;
        if (value && value !== 0) {
          writeToFile(`✅ RETURNED NON-ZERO VALUE: ${value}`);
        } else {
          writeToFile('⚠️ WARNING: Returned zero value');
        }
        resolve(true);
      } else {
        writeToFile('✅ Query executed successfully but returned no results');
        resolve(false);
      }
    } catch (error) {
      writeToFile(`❌ Error executing query: ${error.message}`);
      
      // Try to provide more details about the error
      if (error.message.includes('Invalid column name')) {
        writeToFile('This appears to be a column name error. Please check the column names in the query.');
      } else if (error.message.includes('Invalid object name')) {
        writeToFile('This appears to be a table name error. Please check the table name in the query.');
      } else if (error.message.includes('syntax error')) {
        writeToFile('This appears to be a SQL syntax error. Please check the query syntax.');
      }
      resolve(false);
    }
  });
}

async function testVendorQuery() {
  // Clear the output file if it exists
  if (fs.existsSync(outputFilePath)) {
    fs.unlinkSync(outputFilePath);
  }

  writeToFile('=== P21 Vendor Query Test ===');
  writeToFile(`Starting test at ${new Date().toISOString()}`);

  // Define updated queries to test
  const queriesToTest = [
    {
      name: "Accounts - Payable - Month 1",
      tableName: "vendor",
      sqlQuery: "SELECT ISNULL(COUNT(*), 0) AS value FROM dbo.vendor WITH (NOLOCK) WHERE DATEDIFF(day, date_last_modified, GETDATE()) <= 30"
    },
    {
      name: "Accounts - Payable - Month 2",
      tableName: "vendor",
      sqlQuery: "SELECT ISNULL(COUNT(*), 0) AS value FROM dbo.vendor WITH (NOLOCK) WHERE DATEDIFF(day, date_last_modified, GETDATE()) BETWEEN 31 AND 60"
    }
  ];

  try {
    // Connect to the database
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    writeToFile(`Connection string: ${connectionString}`);
    writeToFile('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    writeToFile('✅ CONNECTED SUCCESSFULLY to ODBC data source!');

    // Test each query individually with a delay between them
    for (const queryItem of queriesToTest) {
      await testQuery(connection, queryItem);
      // Add a delay between queries to avoid console output mixing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Close the connection
    await connection.close();
    writeToFile('\n✅ Connection closed successfully');
  } catch (error) {
    writeToFile(`\n❌ CRITICAL ERROR: ${error.message}`);
  }

  writeToFile(`\n=== Test completed at ${new Date().toISOString()} ===`);
  writeToFile(`Results have been saved to: ${outputFilePath}`);
}

// Run the test
testVendorQuery()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
