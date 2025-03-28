/**
 * Site Locations Test Script
 * This script tests SQL queries for site data using the most common location IDs
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Main function to test site queries
async function testSiteLocations() {
  const results = {
    timestamp: new Date().toISOString(),
    server: null,
    database: null,
    locationQueries: []
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
      
      // Get the top location IDs from oe_hdr
      console.log('\n--- Checking top location IDs ---');
      const topLocationsResult = await connection.query(
        "SELECT TOP 5 location_id, COUNT(*) as count FROM dbo.oe_hdr WITH (NOLOCK) GROUP BY location_id ORDER BY COUNT(*) DESC"
      );
      
      if (topLocationsResult && topLocationsResult.length > 0) {
        console.log('Top 5 location IDs:');
        topLocationsResult.forEach(loc => {
          console.log(`- Location ${loc.location_id}: ${loc.count} orders`);
        });
        
        results.topLocations = topLocationsResult;
      }
      
      // Get location details if available
      try {
        console.log('\n--- Checking location details ---');
        const locationDetailsQuery = `
          SELECT l.location_id, l.location_name, COUNT(h.order_no) as order_count
          FROM dbo.location l
          LEFT JOIN dbo.oe_hdr h WITH (NOLOCK) ON l.location_id = h.location_id
          GROUP BY l.location_id, l.location_name
          ORDER BY COUNT(h.order_no) DESC
        `;
        
        const locationDetailsResult = await connection.query(locationDetailsQuery);
        
        if (locationDetailsResult && locationDetailsResult.length > 0) {
          console.log('Location details:');
          locationDetailsResult.forEach(loc => {
            console.log(`- Location ${loc.location_id}: ${loc.location_name} (${loc.order_count} orders)`);
          });
          
          results.locationDetails = locationDetailsResult;
        }
      } catch (error) {
        console.log(`Error getting location details: ${error.message}`);
      }
      
      // Test queries for each of the top locations
      console.log('\n--- Testing location-specific queries ---');
      
      // Get the top 3 location IDs
      const topLocationIds = topLocationsResult.slice(0, 3).map(loc => loc.location_id);
      
      // For each location, test count and sales queries
      for (const locationId of topLocationIds) {
        // Test count query
        const countQuery = `
          SELECT COUNT(*) as value 
          FROM dbo.oe_hdr WITH (NOLOCK) 
          WHERE location_id = '${locationId}' AND completed = 'N'
        `;
        
        console.log(`Testing count query for location ${locationId}...`);
        try {
          const countResult = await connection.query(countQuery);
          if (countResult && countResult.length > 0) {
            const count = countResult[0].value;
            console.log(`Location ${locationId} count: ${count}`);
            
            results.locationQueries.push({
              locationId,
              type: 'count',
              query: countQuery,
              value: count,
              success: true
            });
          }
        } catch (error) {
          console.log(`Error executing count query for location ${locationId}: ${error.message}`);
          
          results.locationQueries.push({
            locationId,
            type: 'count',
            query: countQuery,
            error: error.message,
            success: false
          });
        }
        
        // Test sales query
        const salesQuery = `
          SELECT ISNULL(SUM(l.extended_price), 0) as value 
          FROM dbo.oe_hdr h WITH (NOLOCK) 
          JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no 
          WHERE h.location_id = '${locationId}' AND h.order_date >= DATEADD(day, -30, GETDATE())
        `;
        
        console.log(`Testing sales query for location ${locationId}...`);
        try {
          const salesResult = await connection.query(salesQuery);
          if (salesResult && salesResult.length > 0) {
            const sales = salesResult[0].value;
            console.log(`Location ${locationId} sales: ${sales}`);
            
            results.locationQueries.push({
              locationId,
              type: 'sales',
              query: salesQuery,
              value: sales,
              success: true
            });
          }
        } catch (error) {
          console.log(`Error executing sales query for location ${locationId}: ${error.message}`);
          
          results.locationQueries.push({
            locationId,
            type: 'sales',
            query: salesQuery,
            error: error.message,
            success: false
          });
        }
      }
      
      // Get total sales
      const totalSalesQuery = `
        SELECT ISNULL(SUM(l.extended_price), 0) as value 
        FROM dbo.oe_hdr h WITH (NOLOCK) 
        JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no 
        WHERE h.order_date >= DATEADD(day, -30, GETDATE())
      `;
      
      console.log(`Testing total sales query...`);
      try {
        const totalSalesResult = await connection.query(totalSalesQuery);
        if (totalSalesResult && totalSalesResult.length > 0) {
          const totalSales = totalSalesResult[0].value;
          console.log(`Total sales: ${totalSales}`);
          
          results.totalSales = totalSales;
        }
      } catch (error) {
        console.log(`Error executing total sales query: ${error.message}`);
        results.totalSalesError = error.message;
      }
      
    } finally {
      // Close the connection
      await connection.close();
      console.log('\n--- Connection closed ---');
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'site-locations-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'site-locations-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the test
testSiteLocations().catch(error => {
  console.error('Unhandled error:', error);
});
