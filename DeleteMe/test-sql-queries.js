const odbc = require('odbc');
const fs = require('fs');
const path = require('path');

// Read the initial-data.ts file directly
const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

// Extract the initialData array using regex
const initialDataMatch = initialDataContent.match(/export const initialData = (\[[\s\S]*?\]);/);
let initialData = [];

if (initialDataMatch && initialDataMatch[1]) {
  // Convert the string to a JavaScript object by evaluating it
  // This is a simple approach for testing purposes only
  try {
    // Replace TypeScript-specific syntax with JavaScript equivalents
    const jsCompatibleString = initialDataMatch[1]
      .replace(/readonly/g, '')
      .replace(/: string/g, '')
      .replace(/: number/g, '');
    
    // Use Function constructor to safely evaluate the string as JavaScript
    initialData = new Function(`return ${jsCompatibleString}`)();
  } catch (error) {
    console.error('Error parsing initialData:', error);
  }
}

async function testSqlQueries() {
  console.log('=== P21 SQL Query Test ===');
  console.log('Starting test at', new Date().toISOString());
  console.log(`Found ${initialData.length} data items in initial-data.ts`);

  // Select a few queries to test
  const queriesToTest = [
    // Accounts Payable
    initialData.find(item => item.id === '11'),
    // Accounts Receivable
    initialData.find(item => item.id === '13'),
    // AR Aging
    initialData.find(item => item.id === '95'),
    // Orders - New
    initialData.find(item => item.id === '41'),
    // Inventory - Total
    initialData.find(item => item.id === '101'),
    // Customers - Total
    initialData.find(item => item.id === '111')
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
      if (!queryItem) {
        console.log('❌ Query item not found');
        continue;
      }

      console.log(`\n--- Testing query for: ${queryItem.name} ---`);
      console.log(`Table: ${queryItem.tableName}`);
      
      try {
        // Extract the SQL expression
        const sqlExpression = queryItem.productionSqlExpression;
        console.log('SQL Query:', sqlExpression);
        
        // Execute the query
        const result = await connection.query(sqlExpression);
        
        if (result && result.length > 0) {
          console.log('✅ Query executed successfully');
          console.log('Result:', result[0]);
        } else {
          console.log('✅ Query executed successfully but returned no results');
        }
      } catch (error) {
        console.error(`❌ Error executing query: ${error.message}`);
        
        // Try to provide more details about the error
        if (error.message.includes('Invalid column name') || error.message.includes('Invalid object name')) {
          console.log('This appears to be a schema error. Please check the table and column names.');
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
testSqlQueries()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
