/**
 * Site Final Test Script
 * This script tests the final SQL expressions for Columbus, Addison, and Lake City
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Main function to test site queries
async function testSiteFinal() {
  const results = {
    timestamp: new Date().toISOString(),
    server: null,
    database: null,
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
      
      // Define site queries with correct location IDs
      const siteQueries = [
        // Columbus (Location 101)
        {
          name: "Columbus - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'"
        },
        {
          name: "Columbus - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '101' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        
        // Addison (Location 100)
        {
          name: "Addison - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'"
        },
        {
          name: "Addison - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '100' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        
        // Lake City (Location 107)
        {
          name: "Lake City - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'"
        },
        {
          name: "Lake City - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '107' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        
        // Total queries
        {
          name: "Total - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
        },
        {
          name: "Total - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())"
        }
      ];
      
      // Execute each query
      for (const queryInfo of siteQueries) {
        console.log(`Testing query: ${queryInfo.name}`);
        try {
          const result = await connection.query(queryInfo.query);
          
          if (result && result.length > 0) {
            // Extract value
            let value = null;
            const firstRow = result[0];
            
            if ('value' in firstRow) {
              value = firstRow.value;
            } else {
              // Use first column
              const firstKey = Object.keys(firstRow)[0];
              value = firstRow[firstKey];
            }
            
            console.log(`${queryInfo.name}: ${value}`);
            
            results.siteQueries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: value,
              success: true
            });
          } else {
            console.log(`${queryInfo.name}: No results returned`);
            
            results.siteQueries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: null,
              success: false,
              error: 'No results returned'
            });
          }
        } catch (error) {
          console.log(`Error executing ${queryInfo.name}: ${error.message}`);
          
          results.siteQueries.push({
            name: queryInfo.name,
            query: queryInfo.query,
            value: null,
            success: false,
            error: error.message
          });
        }
      }
      
      // Calculate Lake City Sales as Total - (Columbus + Addison)
      const totalSales = results.siteQueries.find(q => q.name === 'Total - Sales')?.value || 0;
      const columbusSales = results.siteQueries.find(q => q.name === 'Columbus - Sales')?.value || 0;
      const addisonSales = results.siteQueries.find(q => q.name === 'Addison - Sales')?.value || 0;
      const lakeCitySales = results.siteQueries.find(q => q.name === 'Lake City - Sales')?.value || 0;
      const calculatedLakeCitySales = totalSales - (columbusSales + addisonSales);
      
      console.log('\n--- Sales Summary ---');
      console.log(`Total Sales: ${totalSales}`);
      console.log(`Columbus Sales: ${columbusSales}`);
      console.log(`Addison Sales: ${addisonSales}`);
      console.log(`Lake City Sales (from query): ${lakeCitySales}`);
      console.log(`Lake City Sales (calculated): ${calculatedLakeCitySales}`);
      
      results.salesSummary = {
        totalSales,
        columbusSales,
        addisonSales,
        lakeCitySales,
        calculatedLakeCitySales
      };
      
      // Add calculated Lake City value
      results.siteQueries.push({
        name: "Lake City - Sales (Calculated)",
        query: "Calculated as Total Sales - (Columbus Sales + Addison Sales)",
        value: calculatedLakeCitySales,
        success: true
      });
      
      // Generate SQL expressions for admin database initialization
      console.log('\n--- SQL Expressions for Admin Database ---');
      
      const adminSqlExpressions = {
        columbus: {
          count: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'",
          sales: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '101' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        addison: {
          count: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'",
          sales: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '100' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        lakeCity: {
          count: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'",
          sales: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '107' AND h.order_date >= DATEADD(day, -30, GETDATE())",
          calculatedSales: "Calculated as Total Sales - (Columbus Sales + Addison Sales)"
        }
      };
      
      console.log('Columbus Count SQL:', adminSqlExpressions.columbus.count);
      console.log('Columbus Sales SQL:', adminSqlExpressions.columbus.sales);
      console.log('Addison Count SQL:', adminSqlExpressions.addison.count);
      console.log('Addison Sales SQL:', adminSqlExpressions.addison.sales);
      console.log('Lake City Count SQL:', adminSqlExpressions.lakeCity.count);
      console.log('Lake City Sales SQL:', adminSqlExpressions.lakeCity.sales);
      console.log('Lake City Calculated Sales:', adminSqlExpressions.lakeCity.calculatedSales);
      
      results.adminSqlExpressions = adminSqlExpressions;
      
    } finally {
      // Close the connection
      await connection.close();
      console.log('\n--- Connection closed ---');
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'site-final-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'site-final-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the test
testSiteFinal().catch(error => {
  console.error('Unhandled error:', error);
});
