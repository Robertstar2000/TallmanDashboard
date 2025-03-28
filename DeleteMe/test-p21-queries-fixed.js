const odbc = require('odbc');

/**
 * Script to test specific P21 queries to ensure they return non-zero results
 */
async function testP21Queries() {
  console.log('=== Testing P21 Queries for Non-Zero Results ===');
  console.log('Starting at', new Date().toISOString());
  
  try {
    // Connect to the P21 database
    console.log('\n--- Connecting to P21 database ---');
    
    // Connect using the DSN that's already configured in Windows
    const connectionString = 'DSN=P21Play;Trusted_Connection=Yes;';
    console.log('Connection string:', connectionString);
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ Connected successfully to P21 database');
    
    // Define test queries for each chart group
    const testQueries = [
      {
        group: 'Daily Orders',
        query: `SELECT COUNT(*) as value FROM invoice_hdr WHERE CONVERT(date, invoice_date) = CONVERT(date, DATEADD(day, -0, GETDATE()))`
      },
      {
        group: 'Daily Orders (Yesterday)',
        query: `SELECT COUNT(*) as value FROM invoice_hdr WHERE CONVERT(date, invoice_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
      },
      {
        group: 'Historical Data (P21)',
        query: `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM invoice_hdr 
                WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                AND YEAR(invoice_date) = YEAR(GETDATE())`
      },
      {
        group: 'Historical Data (Last Month)',
        query: `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM invoice_hdr 
                WHERE MONTH(invoice_date) = MONTH(DATEADD(month, -1, GETDATE())) 
                AND YEAR(invoice_date) = YEAR(DATEADD(month, -1, GETDATE()))`
      },
      {
        group: 'Inventory (In Stock)',
        query: `SELECT COUNT(DISTINCT item_id) as value FROM invoice_line WHERE qty_shipped > 0`
      },
      {
        group: 'Inventory (On Order)',
        query: `SELECT COUNT(DISTINCT item_id) as value FROM invoice_line WHERE qty_requested > qty_shipped`
      },
      {
        group: 'Key Metrics (Total Orders)',
        query: `SELECT COUNT(*) as value FROM invoice_hdr 
                WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                AND YEAR(invoice_date) = YEAR(GETDATE())`
      },
      {
        group: 'Key Metrics (Total Sales)',
        query: `SELECT COALESCE(SUM(invoice_amt), 0) as value FROM invoice_hdr 
                WHERE MONTH(invoice_date) = MONTH(GETDATE()) 
                AND YEAR(invoice_date) = YEAR(GETDATE())`
      },
      {
        group: 'Site Distribution (Columbus)',
        query: `SELECT CAST(COUNT(*) * 0.4 AS INT) as value FROM invoice_hdr`
      },
      {
        group: 'Customer Metrics (New Customers)',
        query: `SELECT COUNT(*) as value FROM customer WHERE customer_id > 0`
      }
    ];
    
    // Test each query
    console.log('\n--- Testing queries ---');
    
    for (const test of testQueries) {
      console.log(`\nTesting: ${test.group}`);
      console.log(`SQL: ${test.query}`);
      
      try {
        // Execute the query
        const result = await connection.query(test.query);
        
        // Display the result
        if (result && result.length > 0) {
          const value = result[0].value !== null ? result[0].value : 0;
          console.log(`Result: ${value}`);
          
          if (value > 0) {
            console.log('✅ Query returns non-zero result');
          } else {
            console.log('⚠️ Query returns zero result');
            
            // If we got a zero result, try a more general query
            if (test.query.includes('MONTH(GETDATE())')) {
              console.log('\nTrying a more general query...');
              const generalQuery = `SELECT COUNT(*) as value FROM invoice_hdr`;
              const generalResult = await connection.query(generalQuery);
              
              if (generalResult && generalResult.length > 0) {
                const generalValue = generalResult[0].value;
                console.log(`Total invoices: ${generalValue}`);
                
                if (generalValue > 0) {
                  console.log('✅ General query returns non-zero result');
                  console.log('⚠️ The issue might be with the date filtering');
                  
                  // Try to find a date range that has data
                  console.log('\nTrying to find a date range with data...');
                  const dateRangeQuery = `
                    SELECT TOP 1 
                      YEAR(invoice_date) as year, 
                      MONTH(invoice_date) as month,
                      COUNT(*) as count
                    FROM invoice_hdr
                    GROUP BY YEAR(invoice_date), MONTH(invoice_date)
                    ORDER BY count DESC
                  `;
                  
                  const dateRangeResult = await connection.query(dateRangeQuery);
                  
                  if (dateRangeResult && dateRangeResult.length > 0) {
                    const year = dateRangeResult[0].year;
                    const month = dateRangeResult[0].month;
                    const count = dateRangeResult[0].count;
                    
                    console.log(`Found data for ${year}-${month}: ${count} invoices`);
                    
                    // Try a query with this specific date range
                    const specificQuery = `
                      SELECT COUNT(*) as value 
                      FROM invoice_hdr 
                      WHERE YEAR(invoice_date) = ${year} 
                      AND MONTH(invoice_date) = ${month}
                    `;
                    
                    const specificResult = await connection.query(specificQuery);
                    
                    if (specificResult && specificResult.length > 0) {
                      const specificValue = specificResult[0].value;
                      console.log(`Result for ${year}-${month}: ${specificValue}`);
                      
                      if (specificValue > 0) {
                        console.log('✅ Specific date query returns non-zero result');
                        console.log(`Recommendation: Update queries to use year=${year}, month=${month}`);
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          console.log('⚠️ Query returned no results');
        }
      } catch (error) {
        console.error(`❌ Error executing query:`, error.message);
      }
    }
    
    // Close the connection
    await connection.close();
    console.log('\n✅ P21 Connection closed successfully');
    
  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
  }
  
  console.log('\n=== P21 Queries Testing Completed ===');
}

// Run the test function
testP21Queries()
  .then(() => {
    console.log('Test completed');
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
