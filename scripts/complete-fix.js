// Script to fix all blank SQL expressions in the SQLite database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// SQL expressions for all chart groups
const sqlExpressions = [
  // Key Metrics
  {
    id: "117",
    variable: "Total Orders",
    chartGroup: "Key Metrics",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  {
    id: "118",
    variable: "Open Orders (/day)",
    chartGroup: "Key Metrics",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: "119",
    variable: "All Open Orders",
    chartGroup: "Key Metrics",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    variable: "Daily Revenue",
    chartGroup: "Key Metrics",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    id: "121",
    variable: "Open Invoices",
    chartGroup: "Key Metrics",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    id: "122",
    variable: "OrdersBackloged",
    chartGroup: "Key Metrics",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    id: "123",
    variable: "Total Sales Monthly",
    chartGroup: "Key Metrics",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND h.order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  
  // Historical Data - P21
  {
    id: "20",
    variable: "P21, Jan",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "21",
    variable: "P21, Feb",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "22",
    variable: "P21, Mar",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "23",
    variable: "P21, Apr",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "24",
    variable: "P21, May",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "25",
    variable: "P21, Jun",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "26",
    variable: "P21, Jul",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "27",
    variable: "P21, Aug",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "28",
    variable: "P21, Sep",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "29",
    variable: "P21, Oct",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "30",
    variable: "P21, Nov",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "31",
    variable: "P21, Dec",
    chartGroup: "Historical Data",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  
  // Historical Data - POR
  {
    id: "32",
    variable: "POR, Jan",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 1 AND Year(Date) = Year(Date())"
  },
  {
    id: "33",
    variable: "POR, Feb",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 2 AND Year(Date) = Year(Date())"
  },
  {
    id: "34",
    variable: "POR, Mar",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 3 AND Year(Date) = Year(Date())"
  },
  {
    id: "35",
    variable: "POR, Apr",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 4 AND Year(Date) = Year(Date())"
  },
  {
    id: "36",
    variable: "POR, May",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 5 AND Year(Date) = Year(Date())"
  },
  {
    id: "37",
    variable: "POR, Jun",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 6 AND Year(Date) = Year(Date())"
  },
  {
    id: "38",
    variable: "POR, Jul",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 7 AND Year(Date) = Year(Date())"
  },
  {
    id: "39",
    variable: "POR, Aug",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 8 AND Year(Date) = Year(Date())"
  },
  {
    id: "40",
    variable: "POR, Sep",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 9 AND Year(Date) = Year(Date())"
  },
  {
    id: "41",
    variable: "POR, Oct",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 10 AND Year(Date) = Year(Date())"
  },
  {
    id: "42",
    variable: "POR, Nov",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 11 AND Year(Date) = Year(Date())"
  },
  {
    id: "43",
    variable: "POR, Dec",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 12 AND Year(Date) = Year(Date())"
  },
  
  // Historical Data - Total
  {
    id: "44",
    variable: "Total, Jan",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 1 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "45",
    variable: "Total, Feb",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 2 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "46",
    variable: "Total, Mar",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 3 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "47",
    variable: "Total, Apr",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 4 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "48",
    variable: "Total, May",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 5 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "49",
    variable: "Total, Jun",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 6 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "50",
    variable: "Total, Jul",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 7 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "51",
    variable: "Total, Aug",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 8 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "52",
    variable: "Total, Sep",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 9 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "53",
    variable: "Total, Oct",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 10 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "54",
    variable: "Total, Nov",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 11 AND Year(Date) = Year(Date())) AS value"
  },
  {
    id: "55",
    variable: "Total, Dec",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 12 AND Year(Date) = Year(Date())) AS value"
  },
  
  // Additional Historical Data rows that might have different IDs
  {
    id: "85",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 1 AND Year(Date) = Year(Date())"
  },
  {
    id: "86",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 2 AND Year(Date) = Year(Date())"
  },
  {
    id: "87",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 3 AND Year(Date) = Year(Date())"
  },
  {
    id: "88",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 4 AND Year(Date) = Year(Date())"
  },
  {
    id: "89",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 5 AND Year(Date) = Year(Date())"
  },
  {
    id: "90",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 6 AND Year(Date) = Year(Date())"
  },
  {
    id: "91",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 7 AND Year(Date) = Year(Date())"
  },
  {
    id: "92",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 8 AND Year(Date) = Year(Date())"
  },
  {
    id: "93",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 9 AND Year(Date) = Year(Date())"
  },
  {
    id: "94",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 10 AND Year(Date) = Year(Date())"
  },
  {
    id: "95",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 11 AND Year(Date) = Year(Date())"
  },
  {
    id: "96",
    variable: "POR",
    chartGroup: "Historical Data",
    sql: "SELECT Count(*) AS value FROM PurchaseOrderDetail WHERE Month(Date) = 12 AND Year(Date) = Year(Date())"
  },
  {
    id: "97",
    variable: "Total",
    chartGroup: "Historical Data",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 1 AND Year(Date) = Year(Date())) AS value"
  }
];

// Function to update SQL expressions in the database
async function updateSqlExpressions() {
  console.log('Updating SQL expressions in the SQLite database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Get all rows from the chart_data table
    const rows = await db.all(`
      SELECT id, variable_name, chart_group, production_sql_expression 
      FROM chart_data 
      WHERE chart_group IN ('Key Metrics', 'Historical Data')
    `);
    
    console.log(`Found ${rows.length} rows in Key Metrics and Historical Data groups`);
    
    // Create a map of SQL expressions by ID for easier lookup
    const sqlExpressionsMap = new Map();
    sqlExpressions.forEach(item => {
      sqlExpressionsMap.set(item.id, item);
    });
    
    // Count variables for reporting
    let totalUpdated = 0;
    let blankExpressions = 0;
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Update each row in the database
    for (const row of rows) {
      // Check if the row has a blank SQL expression
      const sql = row.production_sql_expression || '';
      
      if (!sql.trim()) {
        blankExpressions++;
        
        // Check if we have a SQL expression for this ID
        if (sqlExpressionsMap.has(row.id)) {
          const expressionData = sqlExpressionsMap.get(row.id);
          
          // Update the row with the SQL expression
          await db.run(`
            UPDATE chart_data 
            SET production_sql_expression = ? 
            WHERE id = ?
          `, [expressionData.sql, row.id]);
          
          console.log(`Updated SQL expression for ID ${row.id}, Variable: ${row.variable_name}, Chart Group: ${row.chart_group}`);
          totalUpdated++;
        } else {
          // Try to find a matching expression by variable name and chart group
          const matchingExpression = sqlExpressions.find(expr => 
            expr.variable.toLowerCase() === row.variable_name.toLowerCase() && 
            expr.chartGroup === row.chart_group
          );
          
          if (matchingExpression) {
            // Update the row with the matching SQL expression
            await db.run(`
              UPDATE chart_data 
              SET production_sql_expression = ? 
              WHERE id = ?
            `, [matchingExpression.sql, row.id]);
            
            console.log(`Updated SQL expression for ID ${row.id} using variable name match: ${row.variable_name}, Chart Group: ${row.chart_group}`);
            totalUpdated++;
          } else {
            console.log(`No SQL expression found for ID ${row.id}, Variable: ${row.variable_name}, Chart Group: ${row.chart_group}`);
          }
        }
      }
    }
    
    // Commit transaction
    await db.run('COMMIT');
    
    // Close the database connection
    await db.close();
    
    // Print results
    console.log('\n=== RESULTS ===');
    console.log(`Total rows with blank SQL expressions: ${blankExpressions}`);
    console.log(`Total rows updated: ${totalUpdated}`);
    
    // Create a script to save the database to the initialization file
    createSaveDbScript();
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the application or click the "Load DB" button in the admin panel to see the changes');
    console.log('2. Run the save-db-to-init.js script to save the updated database to the initialization file:');
    console.log('   node scripts/save-db-to-init.js');
    
  } catch (error) {
    console.error('Error updating SQL expressions:', error);
  }
}

// Function to create a script that will save the database to the initialization file
function createSaveDbScript() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'save-db-to-init.js');
  
  const scriptContent = `// Script to save the database to the initialization file
const path = require('path');
const { saveDbToInitFile } = require('../lib/db/sqlite');

async function saveDb() {
  console.log('Saving database to initialization file...');
  
  try {
    await saveDbToInitFile();
    console.log('Successfully saved database to initialization file');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

saveDb();
`;
  
  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`Created save script at ${scriptPath}`);
}

// Run the main function
updateSqlExpressions();
