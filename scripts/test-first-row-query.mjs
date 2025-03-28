// Script to test the first row SQL query in the admin spreadsheet
import fetch from 'node-fetch';
import odbc from 'odbc';

async function testFirstRowQuery() {
  try {
    console.log('Testing first row query in admin spreadsheet');
    
    // First, get the admin data to find the first row's SQL expression
    console.log('Fetching admin data...');
    const adminResponse = await fetch('http://localhost:3000/api/admin');
    
    if (!adminResponse.ok) {
      throw new Error(`Failed to fetch admin data: ${adminResponse.statusText}`);
    }
    
    const adminData = await adminResponse.json();
    
    if (!adminData || !adminData.variables || adminData.variables.length === 0) {
      throw new Error('No admin variables found');
    }
    
    // Get the first row with a SQL expression
    const firstVariable = adminData.variables.find(v => v.sqlExpression);
    
    if (!firstVariable) {
      throw new Error('No variable with SQL expression found');
    }
    
    console.log('\nFirst row details:');
    console.log(`ID: ${firstVariable.id}`);
    console.log(`Name: ${firstVariable.name}`);
    console.log(`Server: ${firstVariable.server || firstVariable.serverName}`);
    console.log(`SQL Expression: ${firstVariable.sqlExpression}`);
    
    // Test the SQL expression directly with ODBC
    console.log('\nConnecting to P21Play database...');
    const connection = await odbc.connect('DSN=P21Play;Trusted_Connection=Yes;');
    console.log('Connection established successfully');
    
    // Switch to P21Play database
    await connection.query('USE P21Play');
    
    // Original query
    console.log('\nTesting original query:');
    const originalQuery = firstVariable.sqlExpression;
    console.log(`Query: ${originalQuery}`);
    
    try {
      const originalResult = await connection.query(originalQuery);
      const originalValue = Object.values(originalResult[0])[0];
      console.log(`✅ Original query succeeded with result: ${originalValue}`);
    } catch (originalError) {
      console.log(`❌ Original query failed: ${originalError.message}`);
      
      // Modified query with schema qualification
      console.log('\nTesting with schema qualification:');
      
      // Extract the table name from the query (assuming it's after FROM)
      const fromMatch = originalQuery.match(/FROM\s+(\w+)/i);
      let modifiedQuery = originalQuery;
      
      if (fromMatch && fromMatch[1]) {
        const tableName = fromMatch[1];
        modifiedQuery = originalQuery.replace(
          new RegExp(`FROM\\s+${tableName}`, 'i'),
          `FROM dbo.${tableName} WITH (NOLOCK)`
        );
        
        console.log(`Modified query: ${modifiedQuery}`);
        
        try {
          const modifiedResult = await connection.query(modifiedQuery);
          const modifiedValue = Object.values(modifiedResult[0])[0];
          console.log(`✅ Modified query succeeded with result: ${modifiedValue}`);
        } catch (modifiedError) {
          console.log(`❌ Modified query failed: ${modifiedError.message}`);
        }
      }
    }
    
    // Test the query through the API
    console.log('\nTesting query through API:');
    const apiResponse = await fetch('http://localhost:3000/api/executeQuery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        server: firstVariable.server || firstVariable.serverName || 'P21',
        sql: firstVariable.sqlExpression,
        tableName: firstVariable.tableName,
        testMode: false,
        rowId: firstVariable.id
      }),
    });
    
    if (apiResponse.ok) {
      const apiResult = await apiResponse.json();
      console.log(`API response: ${JSON.stringify(apiResult)}`);
      
      if (apiResult.success) {
        console.log(`✅ API query succeeded with result: ${apiResult.value}`);
      } else {
        console.log(`❌ API query failed: ${apiResult.error || 'Unknown error'}`);
      }
    } else {
      console.log(`❌ API request failed: ${apiResponse.statusText}`);
    }
    
    console.log('\nTest completed');
  } catch (error) {
    console.error('Error testing first row query:', error);
  }
}

// Run the test
testFirstRowQuery().catch(error => {
  console.error('Unhandled error during test execution:', error);
  process.exit(1);
});
