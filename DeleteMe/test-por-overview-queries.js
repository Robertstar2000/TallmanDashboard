/**
 * Test POR Overview Queries
 * 
 * This script tests the SQL queries generated for the POR Overview chart
 * by executing them against the POR database and displaying the results.
 */

const { PORDirectReader } = require('../lib/db/por-direct-reader');
const fs = require('fs');

async function testPOROverviewQueries() {
  console.log('Testing POR Overview Queries...');
  
  // Initialize POR Direct Reader
  const porReader = new PORDirectReader();
  await porReader.connect();
  
  try {
    console.log('Connected to POR database');
    
    // Read the generated queries from the JSON file
    const queriesData = JSON.parse(fs.readFileSync('por-overview-rows.json', 'utf8'));
    
    // Group queries by type
    const queryGroups = {
      'New Rentals': queriesData.filter(row => row.variableName.startsWith('New Rentals')),
      'Open Rentals': queriesData.filter(row => row.variableName.startsWith('Open Rentals')),
      'Rental Value': queriesData.filter(row => row.variableName.startsWith('Rental Value'))
    };
    
    // Test each group of queries
    for (const [groupName, queries] of Object.entries(queryGroups)) {
      console.log(`\n=== Testing ${groupName} Queries ===`);
      
      for (const query of queries) {
        try {
          console.log(`\nExecuting query for: ${query.variableName}`);
          console.log(`SQL: ${query.sqlExpression.replace(/\s+/g, ' ')}`);
          
          // Execute the query
          const result = await porReader.executeQuery(query.sqlExpression);
          
          // Display the result
          const value = result && result.length > 0 ? Object.values(result[0])[0] : null;
          console.log(`Result: ${value !== null ? value : 'NULL'}`);
          
          // Update the value in the query object
          query.value = value !== null ? value : 0;
        } catch (error) {
          console.error(`Error executing query for ${query.variableName}:`, error.message);
        }
      }
    }
    
    // Save the updated queries with actual values
    fs.writeFileSync('por-overview-rows-with-values.json', JSON.stringify(queriesData, null, 2));
    
    // Create updated CSV with actual values
    const csvHeader = 'ChartName,VariableName,Server,TableName,SQLExpression,Value\n';
    const csvRows = queriesData.map(row => {
      return `"${row.chartName}","${row.variableName}","${row.server}","${row.tableName}","${row.sqlExpression.replace(/"/g, '""')}",${row.value}`;
    }).join('\n');
    
    fs.writeFileSync('por-overview-rows-with-values.csv', csvHeader + csvRows);
    
    console.log('\nTest completed. Results saved to:');
    console.log('- por-overview-rows-with-values.json');
    console.log('- por-overview-rows-with-values.csv');
  } catch (error) {
    console.error('Error testing POR Overview queries:', error);
  } finally {
    // Close the connection
    await porReader.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testPOROverviewQueries();
