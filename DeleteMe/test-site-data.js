/**
 * Site Data Test Script
 * This script tests SQL queries for site data (Columbus, Addison, Lake City)
 * and saves results to a file without extensive console output
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Main function to test site queries
async function testSiteData() {
  const results = {
    timestamp: new Date().toISOString(),
    server: null,
    database: null,
    tables: {},
    queries: []
  };
  
  try {
    // Connect to P21 database
    const dsn = process.env.P21_DSN || 'P21Play';
    const connectionString = `DSN=${dsn};Trusted_Connection=Yes;`;
    
    const connection = await odbc.connect(connectionString);
    
    try {
      // Get server and database information
      const serverInfoResult = await connection.query("SELECT @@SERVERNAME AS server_name, DB_NAME() AS database_name");
      if (serverInfoResult && serverInfoResult.length > 0) {
        results.server = serverInfoResult[0].server_name;
        results.database = serverInfoResult[0].database_name;
      }
      
      // Check for location table
      try {
        const locationResult = await connection.query("SELECT TOP 10 * FROM dbo.location");
        if (locationResult && locationResult.length > 0) {
          results.tables.location = {
            exists: true,
            columns: Object.keys(locationResult[0]),
            sample: locationResult.slice(0, 5)
          };
        }
      } catch (error) {
        results.tables.location = { exists: false, error: error.message };
      }
      
      // Check for oe_hdr table
      try {
        const oeHdrResult = await connection.query("SELECT TOP 10 * FROM dbo.oe_hdr");
        if (oeHdrResult && oeHdrResult.length > 0) {
          results.tables.oe_hdr = {
            exists: true,
            columns: Object.keys(oeHdrResult[0]),
            sample: oeHdrResult.slice(0, 5)
          };
          
          // Check if location_id exists in oe_hdr
          if (results.tables.oe_hdr.columns.includes('location_id')) {
            const locationValues = await connection.query("SELECT DISTINCT location_id, COUNT(*) as count FROM dbo.oe_hdr GROUP BY location_id ORDER BY COUNT(*) DESC");
            results.tables.oe_hdr.locationValues = locationValues;
          }
        }
      } catch (error) {
        results.tables.oe_hdr = { exists: false, error: error.message };
      }
      
      // Check for oe_line table
      try {
        const oeLineResult = await connection.query("SELECT TOP 10 * FROM dbo.oe_line");
        if (oeLineResult && oeLineResult.length > 0) {
          results.tables.oe_line = {
            exists: true,
            columns: Object.keys(oeLineResult[0]),
            sample: oeLineResult.slice(0, 5)
          };
        }
      } catch (error) {
        results.tables.oe_line = { exists: false, error: error.message };
      }
      
      // Test site queries
      const siteQueries = [
        // Columbus queries
        {
          name: "Columbus - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '01' AND completed = 'N'"
        },
        {
          name: "Columbus - Count (Alt)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '1' AND completed = 'N'"
        },
        {
          name: "Columbus - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '01' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        {
          name: "Columbus - Sales (Alt)",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '1' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        
        // Addison queries
        {
          name: "Addison - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '02' AND completed = 'N'"
        },
        {
          name: "Addison - Count (Alt)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '2' AND completed = 'N'"
        },
        {
          name: "Addison - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '02' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        {
          name: "Addison - Sales (Alt)",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '2' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        
        // Lake City queries
        {
          name: "Lake City - Count",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '03' AND completed = 'N'"
        },
        {
          name: "Lake City - Count (Alt)",
          query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '3' AND completed = 'N'"
        },
        {
          name: "Lake City - Sales",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '03' AND h.order_date >= DATEADD(day, -30, GETDATE())"
        },
        {
          name: "Lake City - Sales (Alt)",
          query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '3' AND h.order_date >= DATEADD(day, -30, GETDATE())"
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
            
            results.queries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: value,
              success: true
            });
          } else {
            results.queries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: null,
              success: false,
              error: 'No results returned'
            });
          }
        } catch (error) {
          results.queries.push({
            name: queryInfo.name,
            query: queryInfo.query,
            value: null,
            success: false,
            error: error.message
          });
        }
      }
      
      // Calculate Lake City as Total - (Columbus + Addison)
      const totalSales = results.queries.find(q => q.name === 'Total - Sales')?.value || 0;
      const columbusSales = results.queries.find(q => q.name === 'Columbus - Sales')?.value || 0;
      const addisonSales = results.queries.find(q => q.name === 'Addison - Sales')?.value || 0;
      const lakeCitySales = totalSales - (columbusSales + addisonSales);
      
      results.calculatedValues = {
        totalSales,
        columbusSales,
        addisonSales,
        lakeCitySales
      };
      
      // Add calculated Lake City value
      results.queries.push({
        name: "Lake City - Sales (Calculated)",
        query: "Calculated as Total Sales - (Columbus Sales + Addison Sales)",
        value: lakeCitySales,
        success: true
      });
      
    } finally {
      // Close the connection
      await connection.close();
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'site-data-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`Results saved to: ${jsonFile}`);
    
  } catch (error) {
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'site-data-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the test
testSiteData().catch(error => {
  console.error('Unhandled error:', error);
});
