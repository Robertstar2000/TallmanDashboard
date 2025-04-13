// Script to directly fix blank SQL expressions in the SQLite database
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

// SQL expressions for Key Metrics
const keyMetricsSqlExpressions = [
  {
    id: "117",
    name: "Total Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  },
  {
    id: "118",
    name: "Open Orders (/day)",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND CONVERT(date, order_date) = CONVERT(date, GETDATE())"
  },
  {
    id: "119",
    name: "All Open Orders",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'"
  },
  {
    id: "120",
    name: "Daily Revenue",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))"
  },
  {
    id: "121",
    name: "Open Invoices",
    sql: "SELECT COUNT(*) AS value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())"
  },
  {
    id: "122",
    name: "OrdersBackloged",
    sql: "SELECT COUNT(*) AS value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())"
  },
  {
    id: "123",
    name: "Total Sales Monthly",
    sql: "SELECT CAST(ISNULL(SUM(l.extended_price), 0) AS DECIMAL(18,2)) AS value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)) AND h.order_date < DATEADD(month, 1, DATEADD(day, -DATEPART(day, GETDATE()) + 1, CAST(CAST(GETDATE() AS DATE) AS DATETIME)))"
  }
];

// SQL expressions for Historical Data
const historicalDataSqlExpressions = [
  {
    id: "20",
    name: "Historical Data P21, Jan",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "21",
    name: "Historical Data P21, Feb",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "22",
    name: "Historical Data P21, Mar",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "23",
    name: "Historical Data P21, Apr",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "24",
    name: "Historical Data P21, May",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "25",
    name: "Historical Data P21, Jun",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "26",
    name: "Historical Data P21, Jul",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "27",
    name: "Historical Data P21, Aug",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "28",
    name: "Historical Data P21, Sep",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "29",
    name: "Historical Data P21, Oct",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "30",
    name: "Historical Data P21, Nov",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "31",
    name: "Historical Data P21, Dec",
    sql: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())"
  },
  {
    id: "32",
    name: "Historical Data POR, Jan",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 1 AND Year(Date) = Year(Date())"
  },
  {
    id: "33",
    name: "Historical Data POR, Feb",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 2 AND Year(Date) = Year(Date())"
  },
  {
    id: "34",
    name: "Historical Data POR, Mar",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 3 AND Year(Date) = Year(Date())"
  },
  {
    id: "35",
    name: "Historical Data POR, Apr",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 4 AND Year(Date) = Year(Date())"
  },
  {
    id: "36",
    name: "Historical Data POR, May",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 5 AND Year(Date) = Year(Date())"
  },
  {
    id: "37",
    name: "Historical Data POR, Jun",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 6 AND Year(Date) = Year(Date())"
  },
  {
    id: "38",
    name: "Historical Data POR, Jul",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 7 AND Year(Date) = Year(Date())"
  },
  {
    id: "39",
    name: "Historical Data POR, Aug",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 8 AND Year(Date) = Year(Date())"
  },
  {
    id: "40",
    name: "Historical Data POR, Sep",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 9 AND Year(Date) = Year(Date())"
  },
  {
    id: "41",
    name: "Historical Data POR, Oct",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 10 AND Year(Date) = Year(Date())"
  },
  {
    id: "42",
    name: "Historical Data POR, Nov",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 11 AND Year(Date) = Year(Date())"
  },
  {
    id: "43",
    name: "Historical Data POR, Dec",
    sql: "SELECT Count(*) as value FROM PurchaseOrderDetail WHERE Month(Date) = 12 AND Year(Date) = Year(Date())"
  },
  {
    id: "44",
    name: "Historical Data Total, Jan",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 1 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 1 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "45",
    name: "Historical Data Total, Feb",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 2 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 2 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "46",
    name: "Historical Data Total, Mar",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 3 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 3 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "47",
    name: "Historical Data Total, Apr",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 4 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 4 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "48",
    name: "Historical Data Total, May",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 5 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 5 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "49",
    name: "Historical Data Total, Jun",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 6 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 6 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "50",
    name: "Historical Data Total, Jul",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 7 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 7 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "51",
    name: "Historical Data Total, Aug",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 8 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 8 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "52",
    name: "Historical Data Total, Sep",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 9 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 9 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "53",
    name: "Historical Data Total, Oct",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 10 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 10 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "54",
    name: "Historical Data Total, Nov",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 11 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 11 AND Year(Date) = Year(Date())) as value"
  },
  {
    id: "55",
    name: "Historical Data Total, Dec",
    sql: "SELECT (SELECT COUNT(*) FROM dbo.oe_hdr WITH (NOLOCK) WHERE MONTH(order_date) = 12 AND YEAR(order_date) = YEAR(GETDATE())) + (SELECT Count(*) FROM PurchaseOrderDetail WHERE Month(Date) = 12 AND Year(Date) = Year(Date())) as value"
  }
];

// Combine all SQL expressions
const allSqlExpressions = [...keyMetricsSqlExpressions, ...historicalDataSqlExpressions];

// Main function to update blank SQL expressions
async function updateBlankSqlExpressions() {
  console.log('Updating blank SQL expressions in the SQLite database...');
  
  try {
    // Open the database connection
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Connected to the database');
    
    // Get all rows from the chart_data table
    const rows = await db.all('SELECT id, variable_name, chart_group, sql_expression FROM chart_data');
    
    console.log(`Found ${rows.length} rows in the database`);
    
    // Create a map of SQL expressions by ID for easier lookup
    const sqlExpressionsMap = new Map();
    allSqlExpressions.forEach(item => {
      sqlExpressionsMap.set(item.id, item.sql);
    });
    
    // Count variables for reporting
    let totalUpdated = 0;
    let blankExpressions = 0;
    
    // Begin transaction
    await db.run('BEGIN TRANSACTION');
    
    // Check each row in the database
    for (const row of rows) {
      // Check if the row has a blank SQL expression
      const sql = row.sql_expression || '';
      
      if (!sql.trim()) {
        blankExpressions++;
        
        // Check if we have a SQL expression for this ID
        if (sqlExpressionsMap.has(row.id)) {
          const newSql = sqlExpressionsMap.get(row.id);
          
          // Update the row with the new SQL expression
          await db.run(`
            UPDATE chart_data 
            SET sql_expression = ? 
            WHERE id = ?
          `, [newSql, row.id]);
          
          console.log(`Updated SQL expression for ID ${row.id}, Variable: ${row.variable_name}, Chart Group: ${row.chart_group}`);
          totalUpdated++;
        } else {
          console.log(`No SQL expression found for ID ${row.id}, Variable: ${row.variable_name}, Chart Group: ${row.chart_group}`);
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
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Restart the application or click the "Load DB" button in the admin panel to see the changes');
    
  } catch (error) {
    console.error('Error updating blank SQL expressions:', error);
  }
}

// Run the main function
updateBlankSqlExpressions();

