/**
 * Dashboard Metrics Test Script with File Output
 * This script tests all the dashboard metrics and saves results to a file
 */

const fs = require('fs');
const path = require('path');
const odbc = require('odbc');

// Dashboard queries from memory
const dashboardQueries = [
  {
    name: "Total Orders",
    query: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())"
  },
  {
    name: "Open Orders",
    query: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    name: "Open Orders 2",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'"
  },
  {
    name: "Daily Revenue",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    name: "Open Invoices",
    query: "SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    name: "Orders Backlogged",
    query: "SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    name: "Total Monthly Sales",
    query: "SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())"
  }
];

// Function to ensure query has proper schema prefixes
function addSchemaPrefix(query) {
  if (!query.includes('dbo.')) {
    // Common P21 table names to add schema prefix to
    const p21Tables = [
      'oe_hdr', 'oe_line', 'invoice_hdr', 'invoice_line', 
      'customer', 'inv_mast', 'ar_open_items', 'ap_open_items'
    ];
    
    // Add dbo. prefix to each table name
    let modifiedQuery = query;
    p21Tables.forEach(tableName => {
      // Use regex to match table names that aren't already prefixed
      const regex = new RegExp(`(?<![.\\w])${tableName}\\b`, 'g');
      modifiedQuery = modifiedQuery.replace(regex, `dbo.${tableName}`);
    });
    
    return modifiedQuery;
  }
  
  return query;
}

// Main function to test the dashboard metrics
async function testDashboardMetrics() {
  const results = {
    timestamp: new Date().toISOString(),
    server: null,
    database: null,
    metrics: []
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
      
      // Test each dashboard metric
      for (const queryInfo of dashboardQueries) {
        // Add schema prefix if needed
        const modifiedQuery = addSchemaPrefix(queryInfo.query);
        
        try {
          const queryResult = await connection.query(modifiedQuery);
          
          if (queryResult && queryResult.length > 0) {
            const firstRow = queryResult[0];
            const valueKey = Object.keys(firstRow).find(key => key.toLowerCase() === 'value');
            
            if (valueKey) {
              const value = firstRow[valueKey];
              
              results.metrics.push({
                name: queryInfo.name,
                query: modifiedQuery,
                value: value,
                success: true
              });
            } else {
              const firstKey = Object.keys(firstRow)[0];
              const value = firstRow[firstKey];
              
              results.metrics.push({
                name: queryInfo.name,
                query: modifiedQuery,
                value: value,
                column: firstKey,
                success: true
              });
            }
          } else {
            results.metrics.push({
              name: queryInfo.name,
              query: modifiedQuery,
              value: null,
              error: 'No results returned',
              success: false
            });
          }
        } catch (queryError) {
          results.metrics.push({
            name: queryInfo.name,
            query: modifiedQuery,
            value: null,
            error: queryError.message,
            success: false
          });
        }
      }
    } finally {
      // Close the connection
      await connection.close();
    }
    
    // Save results to JSON file
    const jsonFile = path.join(process.cwd(), 'metrics-results.json');
    fs.writeFileSync(jsonFile, JSON.stringify(results, null, 2));
    console.log(`Results saved to: ${jsonFile}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    
    // Save error to file
    const jsonFile = path.join(process.cwd(), 'metrics-error.json');
    fs.writeFileSync(jsonFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    console.log(`Error saved to: ${jsonFile}`);
  }
}

// Run the test
testDashboardMetrics().catch(error => {
  console.error('Unhandled error:', error);
});
