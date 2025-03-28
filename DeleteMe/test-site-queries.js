/**
 * Site Queries Test Script
 * This script tests SQL queries for site data (Columbus, Addison, Lake City)
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Function to execute a query with detailed error handling
async function executeQueryWithDetails(connection, query) {
  try {
    console.log(`Executing query: ${query}`);
    const startTime = Date.now();
    const result = await connection.query(query);
    const duration = Date.now() - startTime;
    
    console.log(`Query executed in ${duration}ms`);
    
    if (!result) {
      return { success: false, error: 'Query returned null result', result: null };
    }
    
    if (!Array.isArray(result)) {
      return { 
        success: false, 
        error: `Query returned non-array result of type ${typeof result}`, 
        result 
      };
    }
    
    if (result.length === 0) {
      return { success: false, error: 'Query returned empty array', result: [] };
    }
    
    return { success: true, result, duration };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      stack: error.stack,
      sqlState: error.sqlState,
      code: error.code
    };
  }
}

// Function to extract value from query result
function extractValueFromResult(result) {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return { success: false, value: null, error: 'No result data' };
  }
  
  const firstRow = result[0];
  
  // Try to find a 'value' column (case insensitive)
  const valueKey = Object.keys(firstRow).find(key => key.toLowerCase() === 'value');
  
  if (valueKey) {
    const rawValue = firstRow[valueKey];
    
    // Handle different value types
    if (typeof rawValue === 'number') {
      return { success: true, value: rawValue, type: 'number' };
    } else if (rawValue !== null && rawValue !== undefined) {
      // Try to convert string values to numbers
      const parsedValue = parseFloat(String(rawValue));
      if (!isNaN(parsedValue)) {
        return { success: true, value: parsedValue, type: 'parsed-number' };
      } else {
        // Return the string value if it can't be parsed as a number
        return { success: true, value: String(rawValue), type: 'string' };
      }
    } else {
      // Handle null/undefined values
      return { success: false, value: 0, type: 'null', error: 'Value is null or undefined' };
    }
  } else {
    // If no 'value' column, use the first column
    const firstKey = Object.keys(firstRow)[0];
    const rawValue = firstRow[firstKey];
    
    // Handle different value types
    if (typeof rawValue === 'number') {
      return { success: true, value: rawValue, column: firstKey, type: 'number' };
    } else if (rawValue !== null && rawValue !== undefined) {
      // Try to convert string values to numbers
      const parsedValue = parseFloat(String(rawValue));
      if (!isNaN(parsedValue)) {
        return { success: true, value: parsedValue, column: firstKey, type: 'parsed-number' };
      } else {
        // Return the string value if it can't be parsed as a number
        return { success: true, value: String(rawValue), column: firstKey, type: 'string' };
      }
    } else {
      // Handle null/undefined values
      return { success: false, value: 0, column: firstKey, type: 'null', error: 'Value is null or undefined' };
    }
  }
}

// Main function to test site queries
async function testSiteQueries() {
  const results = {
    timestamp: new Date().toISOString(),
    server: null,
    database: null,
    locationInfo: [],
    siteQueries: []
  };
  
  try {
    // Connect to P21 database
    const dsn = process.env.P21_DSN || 'P21Play';
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    
    console.log('Connecting to ODBC data source...');
    const connection = await odbc.connect(connectionString);
    console.log('✅ CONNECTED SUCCESSFULLY to ODBC data source!');
    
    try {
      // Get server and database information
      const serverInfoResult = await connection.query("SELECT @@SERVERNAME AS server_name, DB_NAME() AS database_name");
      if (serverInfoResult && serverInfoResult.length > 0) {
        results.server = serverInfoResult[0].server_name;
        results.database = serverInfoResult[0].database_name;
        console.log(`Server: ${results.server}, Database: ${results.database}`);
      }
      
      // Step 1: Check if location_mst table exists and its structure
      console.log('\n--- Checking location_mst table ---');
      try {
        const locationTableResult = await connection.query("SELECT TOP 1 * FROM dbo.location_mst");
        if (locationTableResult && locationTableResult.length > 0) {
          console.log('✅ location_mst table exists');
          console.log('Columns:', Object.keys(locationTableResult[0]).join(', '));
          
          // Get all locations
          const allLocationsResult = await connection.query("SELECT location_id, location_desc FROM dbo.location_mst");
          if (allLocationsResult && allLocationsResult.length > 0) {
            console.log(`Found ${allLocationsResult.length} locations:`);
            allLocationsResult.forEach(loc => {
              console.log(`- Location ${loc.location_id}: ${loc.location_desc}`);
              results.locationInfo.push({
                id: loc.location_id,
                description: loc.location_desc
              });
            });
          }
        }
      } catch (error) {
        console.log('❌ Error checking location_mst table:', error.message);
        
        // Try alternative table names
        try {
          console.log('Trying location table...');
          const locationTableResult = await connection.query("SELECT TOP 1 * FROM dbo.location");
          if (locationTableResult && locationTableResult.length > 0) {
            console.log('✅ location table exists');
            console.log('Columns:', Object.keys(locationTableResult[0]).join(', '));
            
            // Get all locations
            const allLocationsResult = await connection.query("SELECT location_id, location_name FROM dbo.location");
            if (allLocationsResult && allLocationsResult.length > 0) {
              console.log(`Found ${allLocationsResult.length} locations:`);
              allLocationsResult.forEach(loc => {
                console.log(`- Location ${loc.location_id}: ${loc.location_name}`);
                results.locationInfo.push({
                  id: loc.location_id,
                  description: loc.location_name
                });
              });
            }
          }
        } catch (locError) {
          console.log('❌ Error checking location table:', locError.message);
        }
      }
      
      // Step 2: Check if oe_hdr table has location_id field
      console.log('\n--- Checking oe_hdr table structure ---');
      try {
        const oeHdrResult = await connection.query("SELECT TOP 1 * FROM dbo.oe_hdr");
        if (oeHdrResult && oeHdrResult.length > 0) {
          console.log('✅ oe_hdr table exists');
          const columns = Object.keys(oeHdrResult[0]);
          console.log('Columns:', columns.join(', '));
          
          // Check if location_id exists
          if (columns.includes('location_id')) {
            console.log('✅ location_id column exists in oe_hdr');
            
            // Get distinct location_id values from oe_hdr
            const distinctLocationsResult = await connection.query("SELECT DISTINCT location_id, COUNT(*) as count FROM dbo.oe_hdr GROUP BY location_id");
            if (distinctLocationsResult && distinctLocationsResult.length > 0) {
              console.log(`Found ${distinctLocationsResult.length} distinct location_id values in oe_hdr:`);
              distinctLocationsResult.forEach(loc => {
                console.log(`- Location ${loc.location_id}: ${loc.count} orders`);
              });
            }
          } else {
            console.log('❌ location_id column does not exist in oe_hdr');
            
            // Look for alternative location columns
            const possibleLocationColumns = columns.filter(col => 
              col.toLowerCase().includes('loc') || 
              col.toLowerCase().includes('site') || 
              col.toLowerCase().includes('branch')
            );
            
            if (possibleLocationColumns.length > 0) {
              console.log('Possible alternative location columns:', possibleLocationColumns.join(', '));
              
              // Check each possible column
              for (const column of possibleLocationColumns) {
                console.log(`Checking values in ${column}...`);
                const distinctValuesResult = await connection.query(`SELECT DISTINCT ${column}, COUNT(*) as count FROM dbo.oe_hdr GROUP BY ${column}`);
                if (distinctValuesResult && distinctValuesResult.length > 0) {
                  console.log(`Found ${distinctValuesResult.length} distinct values in ${column}:`);
                  distinctValuesResult.forEach(val => {
                    console.log(`- ${column} = ${val[column]}: ${val.count} orders`);
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.log('❌ Error checking oe_hdr table:', error.message);
      }
      
      // Step 3: Test different site queries
      console.log('\n--- Testing Site Queries ---');
      
      // Array of queries to test
      const siteQueries = [
        // Original queries from initial-data.ts
        {
          name: "Columbus (Original)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '01' AND status = 'O'"
        },
        {
          name: "Addison (Original)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '02' AND status = 'O'"
        },
        {
          name: "Lake City (Original)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '03' AND status = 'O'"
        },
        
        // Alternative queries with different location IDs
        {
          name: "Columbus (Alt 1)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '1' AND status = 'O'"
        },
        {
          name: "Addison (Alt 1)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '2' AND status = 'O'"
        },
        {
          name: "Lake City (Alt 1)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '3' AND status = 'O'"
        },
        
        // Alternative queries with different status values
        {
          name: "Columbus (Alt 2)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '01' AND completed = 'N'"
        },
        {
          name: "Addison (Alt 2)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '02' AND completed = 'N'"
        },
        {
          name: "Lake City (Alt 2)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '03' AND completed = 'N'"
        },
        
        // Queries with location names instead of IDs
        {
          name: "Columbus (Alt 3)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.location_mst l ON h.location_id = l.location_id WHERE l.location_desc LIKE '%Columbus%' AND h.completed = 'N'"
        },
        {
          name: "Addison (Alt 3)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.location_mst l ON h.location_id = l.location_id WHERE l.location_desc LIKE '%Addison%' AND h.completed = 'N'"
        },
        {
          name: "Lake City (Alt 3)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.location_mst l ON h.location_id = l.location_id WHERE l.location_desc LIKE '%Lake City%' AND h.completed = 'N'"
        },
        
        // Queries for total sales by location
        {
          name: "Columbus Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '01' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        {
          name: "Addison Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '02' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        {
          name: "Total Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())"
        }
      ];
      
      // Test each query
      for (const queryInfo of siteQueries) {
        console.log(`\n--- ${queryInfo.name} ---`);
        console.log(`Query: ${queryInfo.query}`);
        
        try {
          const queryResult = await executeQueryWithDetails(connection, queryInfo.query);
          
          if (queryResult.success) {
            console.log(`✅ Query executed successfully in ${queryResult.duration}ms`);
            
            const valueResult = extractValueFromResult(queryResult.result);
            
            if (valueResult.success) {
              console.log(`✅ Value: ${valueResult.value} (type: ${valueResult.type}${valueResult.column ? ', column: ' + valueResult.column : ''})`);
              
              // Check if the value is zero
              if (valueResult.value === 0 || valueResult.value === '0') {
                console.log(`⚠️ WARNING: Query returned zero value!`);
              } else {
                console.log(`✅ SUCCESS: Query returned non-zero value: ${valueResult.value}`);
              }
              
              // Add to results
              results.siteQueries.push({
                name: queryInfo.name,
                query: queryInfo.query,
                value: valueResult.value,
                type: valueResult.type,
                success: true
              });
            } else {
              console.log(`❌ Failed to extract value: ${valueResult.error}`);
              
              // Add to results
              results.siteQueries.push({
                name: queryInfo.name,
                query: queryInfo.query,
                value: null,
                error: valueResult.error,
                success: false
              });
            }
            
            console.log(`Raw result: ${JSON.stringify(queryResult.result[0])}`);
          } else {
            console.log(`❌ Query execution failed: ${queryResult.error}`);
            
            // Add to results
            results.siteQueries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: null,
              error: queryResult.error,
              success: false
            });
          }
        } catch (error) {
          console.log(`❌ Error executing query: ${error.message}`);
          
          // Add to results
          results.siteQueries.push({
            name: queryInfo.name,
            query: queryInfo.query,
            value: null,
            error: error.message,
            success: false
          });
        }
      }
      
      // Calculate Lake City as Total - (Columbus + Addison)
      console.log('\n--- Lake City (Calculated) ---');
      const totalSales = results.siteQueries.find(q => q.name === 'Total Sales')?.value || 0;
      const columbusSales = results.siteQueries.find(q => q.name === 'Columbus Sales')?.value || 0;
      const addisonSales = results.siteQueries.find(q => q.name === 'Addison Sales')?.value || 0;
      const lakeCitySales = totalSales - (columbusSales + addisonSales);
      
      console.log(`Total Sales: ${totalSales}`);
      console.log(`Columbus Sales: ${columbusSales}`);
      console.log(`Addison Sales: ${addisonSales}`);
      console.log(`Lake City Sales (calculated): ${lakeCitySales}`);
      
      results.siteQueries.push({
        name: "Lake City Sales (Calculated)",
        query: "Calculated as Total Sales - (Columbus Sales + Addison Sales)",
        value: lakeCitySales,
        type: 'calculated',
        success: true
      });
      
    } finally {
      // Close the connection
      await connection.close();
      console.log('\n--- Connection closed ---');
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'site-queries-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'site-queries-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the test
testSiteQueries().catch(error => {
  console.error('Unhandled error:', error);
});
