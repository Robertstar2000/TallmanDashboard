const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const configPath = path.join(__dirname, 'ms-access-config.json');
let dbPath = 'C:\\Users\\BobM\\Desktop\\POR.mdb';
let tableName = 'purchase_orders'; // Default table name

// Load configuration if it exists
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    dbPath = config.dbPath || dbPath;
  } catch (error) {
    console.error('Error loading configuration:', error.message);
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to find tables in the database
async function findTables() {
  console.log('\n2. Listing all tables in the database...');
  try {
    // Try different approaches to list tables in MS Access
    const tableQueries = [
      // Standard approach for MS Access system tables
      `SELECT MSysObjects.Name AS table_name FROM MSysObjects WHERE (MSysObjects.Type) In (1,4,6) AND (MSysObjects.Flags)=0 ORDER BY MSysObjects.Name`,
      
      // Alternative using system catalog
      `SELECT Name FROM MSysObjects WHERE Type=1 AND Flags=0`,
      
      // Using schema information
      `SELECT * FROM INFORMATION_SCHEMA.TABLES`,
      
      // Using Access-specific schema info
      `SELECT * FROM MSysObjects WHERE Type=1`,
      
      // Direct queries for common table names in rental systems
      `SELECT TOP 1 * FROM Contracts`,
      `SELECT TOP 1 * FROM Rentals`,
      `SELECT TOP 1 * FROM Invoices`,
      `SELECT TOP 1 * FROM Orders`,
      `SELECT TOP 1 * FROM PurchaseOrders`,
      `SELECT TOP 1 * FROM PO`,
      `SELECT TOP 1 * FROM POHeaders`,
      `SELECT TOP 1 * FROM Customers`,
      `SELECT TOP 1 * FROM Inventory`,
      `SELECT TOP 1 * FROM Items`
    ];
    
    console.log('Trying multiple approaches to find tables...');
    
    for (const query of tableQueries) {
      try {
        console.log(`\nExecuting query: ${query}`);
        const response = await axios.post('http://localhost:3000/api/admin/test-query', {
          server: 'POR',
          sql: query,
          testMode: false
        });
        
        const result = response.data;
        console.log('Query result:', result);
        
        if (result.success && result.rows && result.rows.length > 0) {
          console.log('Success! Found data with this query.');
          
          // If this is a direct table query, we've found a table
          if (query.includes('SELECT TOP 1 * FROM ')) {
            const tableName = query.split('FROM ')[1].trim();
            console.log(`Found table: ${tableName}`);
            
            // Update the tableName for further queries
            return tableName;
          }
          
          // If this is a schema query, extract table names
          if (Array.isArray(result.rows)) {
            const tableNames = result.rows.map(row => {
              // Try different possible column names for table name
              return row.table_name || row.Name || row.TABLE_NAME || Object.values(row)[0];
            }).filter(Boolean);
            
            console.log('Tables found:', tableNames.join(', '));
            
            // Check for purchase order related tables
            const poRelatedTables = tableNames.filter(name => {
              const lowerName = String(name).toLowerCase();
              return lowerName.includes('purchase') || 
                     lowerName.includes('order') || 
                     lowerName.includes('po') ||
                     lowerName.includes('contract') ||
                     lowerName.includes('invoice');
            });
            
            if (poRelatedTables.length > 0) {
              console.log('Potential purchase order tables:', poRelatedTables.join(', '));
              return poRelatedTables[0]; // Return the first matching table
            }
          }
        }
      } catch (error) {
        console.log(`Query failed: ${error.message}`);
      }
    }
    
    console.log('Could not find any tables using standard approaches.');
    return null;
  } catch (error) {
    console.error('Error listing tables:', error.message);
    return null;
  }
}

// Main function
async function testMsAccessIntegration() {
  console.log('Testing MS Access integration flow...');
  
  // If no database path is configured, prompt the user
  if (!dbPath) {
    dbPath = await new Promise(resolve => {
      rl.question('Please enter the path to your MS Access database: ', answer => {
        resolve(answer.trim());
      });
    });
    
    // Save the configuration for future use
    fs.writeFileSync(configPath, JSON.stringify({ dbPath }, null, 2));
  }
  
  console.log(`Using MS Access database path: ${dbPath}`);
  
  // Step 1: Test connection to MS Access database
  console.log('\n1. Testing connection to MS Access database...');
  const connectionResponse = await axios.post('http://localhost:3000/api/connection/test', {
    config: {
      type: 'POR',
      filePath: dbPath
    }
  });
  
  const connectionResult = connectionResponse.data;
  console.log('Connection test result:', connectionResult);
  
  if (!connectionResult.success) {
    console.error('Connection test failed:', connectionResult.message || 'Unknown error');
    rl.close();
    return;
  }
  
  console.log('Connection test successful!');
  
  // Step 2: Find tables in the database
  const foundTable = await findTables();
  
  if (foundTable) {
    tableName = foundTable;
    console.log(`\nUsing table: ${tableName}`);
    
    // Step 3: Get table structure
    console.log(`\n3. Getting table structure for ${tableName}...`);
    const tableStructureQuery = `SELECT TOP 1 * FROM ${tableName}`;
    
    try {
      const tableStructureResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
        server: 'POR',
        sql: tableStructureQuery,
        testMode: false
      });
      
      const tableStructureResult = tableStructureResponse.data;
      console.log('Table structure result:', tableStructureResult);
      
      if (!tableStructureResult.success) {
        console.error('Table structure query failed:', tableStructureResult.error || tableStructureResult.message);
      } else {
        console.log('Table structure query successful!');
        
        if (tableStructureResult.rows && tableStructureResult.rows.length > 0) {
          const columns = Object.keys(tableStructureResult.rows[0]);
          console.log('Table columns:', columns.join(', '));
          
          // Check for date and amount fields
          const dateFields = columns.filter(col => 
            col.toLowerCase().includes('date') || 
            col.toLowerCase().includes('dt')
          );
          
          const amountFields = columns.filter(col => 
            col.toLowerCase().includes('amt') || 
            col.toLowerCase().includes('amount') || 
            col.toLowerCase().includes('total') || 
            col.toLowerCase().includes('price') ||
            col.toLowerCase().includes('cost')
          );
          
          console.log('Potential date fields:', dateFields.join(', '));
          console.log('Potential amount fields:', amountFields.join(', '));
          
          // Set field names for queries
          const dateField = dateFields[0] || 'date';
          const amountField = amountFields[0] || 'amount';
          
          console.log(`Using date field: ${dateField}`);
          console.log(`Using amount field: ${amountField}`);
          
          // Step 4: Test count query
          console.log('\n4. Testing count query...');
          const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
          
          const countQueryResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
            server: 'POR',
            sql: countQuery,
            testMode: false
          });
          
          const countQueryResult = countQueryResponse.data;
          console.log('Count query result:', countQueryResult);
          
          if (!countQueryResult.success) {
            console.error('Count query failed:', countQueryResult.error || countQueryResult.message);
          } else {
            console.log('Count query execution successful!');
            console.log(`Total records: ${countQueryResult.value || 0}`);
            
            if (countQueryResult.value === 0) {
              console.log('No records found in the table. Skipping remaining queries.');
              rl.close();
              return;
            }
          }
          
          // Step 5: Test value query with Format
          console.log('\n5. Testing value query (with Format)...');
          const valueQuery = `SELECT Nz(SUM(${amountField}), 0) as value FROM ${tableName} WHERE Format(${dateField}, 'yyyy-mm') = Format(Date(), 'yyyy-mm')`;
          
          const valueQueryResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
            server: 'POR',
            sql: valueQuery,
            testMode: false
          });
          
          const valueQueryResult = valueQueryResponse.data;
          console.log('Value query result:', valueQueryResult);
          
          if (!valueQueryResult.success) {
            console.error('Value query failed:', valueQueryResult.error || valueQueryResult.message);
          } else {
            console.log('Value query execution successful!');
            console.log(`Value returned: ${valueQueryResult.value}`);
          }
          
          // Step 6: Test alternative query with Year/Month
          console.log('\n6. Testing alternative query (with Year/Month)...');
          const alternativeQuery = `SELECT Nz(SUM(${amountField}), 0) as value FROM ${tableName} WHERE Year(${dateField}) = Year(Date()) AND Month(${dateField}) = Month(Date())`;
          
          const alternativeQueryResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
            server: 'POR',
            sql: alternativeQuery,
            testMode: false
          });
          
          const alternativeQueryResult = alternativeQueryResponse.data;
          console.log('Alternative query result:', alternativeQueryResult);
          
          if (!alternativeQueryResult.success) {
            console.error('Alternative query failed:', alternativeQueryResult.error || alternativeQueryResult.message);
          } else {
            console.log('Alternative query execution successful!');
            console.log(`Value returned: ${alternativeQueryResult.value}`);
          }
          
          // Step 7: Get date range of data
          console.log('\n7. Getting date range of data...');
          const dateRangeQuery = `SELECT MIN(${dateField}) as min_date, MAX(${dateField}) as max_date FROM ${tableName}`;
          
          const dateRangeResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
            server: 'POR',
            sql: dateRangeQuery,
            testMode: false
          });
          
          const dateRangeResult = dateRangeResponse.data;
          console.log('Date range result:', dateRangeResult);
          
          if (!dateRangeResult.success) {
            console.error('Date range query failed:', dateRangeResult.error || dateRangeResult.message);
          } else {
            console.log('Date range query successful!');
            if (dateRangeResult.rows && dateRangeResult.rows.length > 0) {
              console.log(`Date range: ${dateRangeResult.rows[0].min_date} to ${dateRangeResult.rows[0].max_date}`);
            } else {
              console.log('Date range: No data returned');
            }
          }
          
          // Step 8: Test a simple query for all records
          console.log('\n8. Testing simple query for all records...');
          const simpleQuery = `SELECT TOP 5 * FROM ${tableName}`;
          
          const simpleQueryResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
            server: 'POR',
            sql: simpleQuery,
            testMode: false
          });
          
          const simpleQueryResult = simpleQueryResponse.data;
          console.log('Simple query result:', simpleQueryResult);
          
          if (!simpleQueryResult.success) {
            console.error('Simple query failed:', simpleQueryResult.error || simpleQueryResult.message);
          } else {
            console.log('Simple query execution successful!');
            if (simpleQueryResult.rows && simpleQueryResult.rows.length > 0) {
              console.log(`Retrieved ${simpleQueryResult.rows.length} records`);
              console.log('Sample record:', JSON.stringify(simpleQueryResult.rows[0], null, 2));
            } else {
              console.log('No records retrieved');
            }
          }
        } else {
          console.log('Table columns: No data returned');
        }
      }
    } catch (error) {
      console.error('Error getting table structure:', error.message);
    }
  } else {
    console.log('\nNo suitable tables found. Please check the database structure manually.');
    
    // Prompt user to enter a table name manually
    tableName = await new Promise(resolve => {
      rl.question('Please enter the name of the table to test: ', answer => {
        resolve(answer.trim() || 'purchase_orders');
      });
    });
    
    console.log(`\nUsing manually entered table: ${tableName}`);
    
    // Test if the table exists
    try {
      const testQuery = `SELECT TOP 1 * FROM ${tableName}`;
      const testResponse = await axios.post('http://localhost:3000/api/admin/test-query', {
        server: 'POR',
        sql: testQuery,
        testMode: false
      });
      
      const testResult = testResponse.data;
      if (testResult.success) {
        console.log(`Table ${tableName} exists and is accessible.`);
        if (testResult.rows && testResult.rows.length > 0) {
          console.log('Columns:', Object.keys(testResult.rows[0]).join(', '));
        } else {
          console.log('Table exists but has no data.');
        }
      } else {
        console.log(`Table ${tableName} does not exist or is not accessible.`);
      }
    } catch (error) {
      console.error(`Error testing table ${tableName}:`, error.message);
    }
  }
  
  console.log('\nAll tests completed!');
  rl.close();
}

// Run the main function
testMsAccessIntegration().catch(error => {
  console.error('Error in test script:', error);
  rl.close();
});
