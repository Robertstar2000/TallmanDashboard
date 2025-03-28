/**
 * Script to update SQL expressions in the admin spreadsheet database
 * with the correct schema prefixes and date filters
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Helper function to open the database
function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`Connected to database: ${dbPath}`);
        resolve(db);
      }
    });
  });
}

// Helper function to run a query
function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to run an update query
function runUpdate(db, query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ changes: this.changes, lastID: this.lastID });
      }
    });
  });
}

// Define the correct SQL expressions for each key metric
const correctSqlExpressions = {
  'Total Orders': {
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`,
    productionSql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`
  },
  'Open Orders': {
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N'`,
    productionSql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'`
  },
  'Open Orders Value': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`,
    productionSql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`
  },
  'Daily Revenue': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`,
    productionSql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
  },
  'Open Invoices': {
    sql: `SELECT COUNT(*) as value FROM invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`,
    productionSql: `SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
  },
  'Orders Backlogged': {
    sql: `SELECT COUNT(*) as value FROM oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`,
    productionSql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`
  },
  'Total Monthly Sales': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM oe_hdr h WITH (NOLOCK) JOIN oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`,
    productionSql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
  }
};

// Main function to update SQL expressions
async function updateSqlExpressions() {
  console.log('Starting SQL expression update...');
  
  // Try different possible database paths
  const possiblePaths = [
    './dashboard.db',
    './data/dashboard.db',
    './tallman.db',
    './data/tallman.db'
  ];
  
  let db = null;
  let dbPath = null;
  
  // Try to open each database until we find one that works
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        db = await openDatabase(path);
        dbPath = path;
        break;
      }
    } catch (error) {
      console.error(`Error opening database ${path}:`, error.message);
    }
  }
  
  if (!db) {
    console.error('Could not open any database. Exiting.');
    return;
  }
  
  try {
    console.log(`Using database at ${dbPath}`);
    
    // Get all rows from the chart_data table
    const rows = await runQuery(db, `
      SELECT 
        id,
        chart_name,
        variable_name,
        server_name,
        sql_expression,
        production_sql_expression
      FROM chart_data
    `);
    
    console.log(`Found ${rows.length} rows in chart_data table`);
    
    // Find the key metrics rows
    const keyMetricsRows = rows.filter(row => 
      row.chart_name === 'Key Metrics'
    );
    
    console.log(`Found ${keyMetricsRows.length} Key Metrics rows`);
    
    // Update each key metric row with the correct SQL expressions
    let updatedCount = 0;
    
    for (const row of keyMetricsRows) {
      const variableName = row.variable_name;
      
      if (correctSqlExpressions[variableName]) {
        console.log(`Updating SQL expressions for ${variableName}...`);
        
        const correctExpressions = correctSqlExpressions[variableName];
        
        // Update the SQL expressions
        const result = await runUpdate(db, `
          UPDATE chart_data
          SET 
            sql_expression = ?,
            production_sql_expression = ?
          WHERE id = ?
        `, [
          correctExpressions.sql,
          correctExpressions.productionSql,
          row.id
        ]);
        
        console.log(`Updated ${result.changes} rows for ${variableName}`);
        updatedCount += result.changes;
      } else {
        console.log(`No correct SQL expression defined for ${variableName}, skipping`);
      }
    }
    
    console.log(`\nUpdated ${updatedCount} SQL expressions in the database`);
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const updatedRows = await runQuery(db, `
      SELECT 
        id,
        chart_name,
        variable_name,
        sql_expression,
        production_sql_expression
      FROM chart_data
      WHERE chart_name = 'Key Metrics'
    `);
    
    for (const row of updatedRows) {
      console.log(`\n${row.variable_name}:`);
      console.log(`Test SQL: ${row.sql_expression}`);
      console.log(`Production SQL: ${row.production_sql_expression}`);
    }
    
  } catch (error) {
    console.error('Error updating SQL expressions:', error);
  } finally {
    // Close the database connection
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed.');
        }
      });
    }
  }
}

// Run the update
updateSqlExpressions().catch(error => {
  console.error('Unhandled error:', error);
});
