/**
 * Admin Site Queries Test Script
 * This script tests the SQL expressions for site data as defined in the admin database
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Site queries from admin database
const siteQueries = [
  // Site Distribution - Count queries
  {
    name: "Columbus - Count",
    query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101' AND completed = 'N'"
  },
  {
    name: "Addison - Count",
    query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '100' AND completed = 'N'"
  },
  {
    name: "Lake City - Count",
    query: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '107' AND completed = 'N'"
  },
  
  // Site Sales - Sales queries
  {
    name: "Columbus - Sales",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '101' AND h.order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    name: "Addison - Sales",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.location_id = '100' AND h.order_date >= DATEADD(day, -30, GETDATE())"
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

// Main function to test admin site queries
async function testAdminSiteQueries() {
  const results = {
    timestamp: new Date().toISOString(),
    server: null,
    database: null,
    queries: []
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
            
            results.queries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: value,
              success: true
            });
          } else {
            console.log(`${queryInfo.name}: No results returned`);
            
            results.queries.push({
              name: queryInfo.name,
              query: queryInfo.query,
              value: null,
              success: false,
              error: 'No results returned'
            });
          }
        } catch (error) {
          console.log(`Error executing ${queryInfo.name}: ${error.message}`);
          
          results.queries.push({
            name: queryInfo.name,
            query: queryInfo.query,
            value: null,
            success: false,
            error: error.message
          });
        }
      }
      
      // Calculate site percentages
      const totalSales = results.queries.find(q => q.name === 'Total - Sales')?.value || 0;
      const columbusSales = results.queries.find(q => q.name === 'Columbus - Sales')?.value || 0;
      const addisonSales = results.queries.find(q => q.name === 'Addison - Sales')?.value || 0;
      const lakeCitySales = results.queries.find(q => q.name === 'Lake City - Sales')?.value || 0;
      
      const columbusPercent = totalSales > 0 ? (columbusSales / totalSales) * 100 : 0;
      const addisonPercent = totalSales > 0 ? (addisonSales / totalSales) * 100 : 0;
      const lakeCityPercent = totalSales > 0 ? (lakeCitySales / totalSales) * 100 : 0;
      
      console.log('\n--- Sales Summary ---');
      console.log(`Total Sales: $${totalSales.toFixed(2)}`);
      console.log(`Columbus Sales: $${columbusSales.toFixed(2)} (${columbusPercent.toFixed(2)}%)`);
      console.log(`Addison Sales: $${addisonSales.toFixed(2)} (${addisonPercent.toFixed(2)}%)`);
      console.log(`Lake City Sales: $${lakeCitySales.toFixed(2)} (${lakeCityPercent.toFixed(2)}%)`);
      
      results.salesSummary = {
        totalSales,
        columbusSales,
        addisonSales,
        lakeCitySales,
        columbusPercent,
        addisonPercent,
        lakeCityPercent
      };
      
      // Calculate order counts percentages
      const totalCount = results.queries.find(q => q.name === 'Total - Count')?.value || 0;
      const columbusCount = results.queries.find(q => q.name === 'Columbus - Count')?.value || 0;
      const addisonCount = results.queries.find(q => q.name === 'Addison - Count')?.value || 0;
      const lakeCityCount = results.queries.find(q => q.name === 'Lake City - Count')?.value || 0;
      
      const columbusCountPercent = totalCount > 0 ? (columbusCount / totalCount) * 100 : 0;
      const addisonCountPercent = totalCount > 0 ? (addisonCount / totalCount) * 100 : 0;
      const lakeCityCountPercent = totalCount > 0 ? (lakeCityCount / totalCount) * 100 : 0;
      
      console.log('\n--- Order Count Summary ---');
      console.log(`Total Orders: ${totalCount}`);
      console.log(`Columbus Orders: ${columbusCount} (${columbusCountPercent.toFixed(2)}%)`);
      console.log(`Addison Orders: ${addisonCount} (${addisonCountPercent.toFixed(2)}%)`);
      console.log(`Lake City Orders: ${lakeCityCount} (${lakeCityCountPercent.toFixed(2)}%)`);
      
      results.orderCountSummary = {
        totalCount,
        columbusCount,
        addisonCount,
        lakeCityCount,
        columbusCountPercent,
        addisonCountPercent,
        lakeCityCountPercent
      };
      
    } finally {
      // Close the connection
      await connection.close();
      console.log('\n--- Connection closed ---');
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'admin-site-queries-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'admin-site-queries-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the test
testAdminSiteQueries().catch(error => {
  console.error('Unhandled error:', error);
});
