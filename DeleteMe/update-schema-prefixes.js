/**
 * Script to update the SQL expressions in the chart_data table
 * to include the proper schema prefixes (dbo.) for P21 database tables
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

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

// Define the correct SQL expressions for each key metric with schema prefixes
const correctSqlExpressions = {
  'Total Orders': {
    sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())`
  },
  'Open Orders': {
    sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N'`
  },
  'Open Orders 2': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.completed = 'N'`
  },
  'Daily Revenue': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE CONVERT(date, h.order_date) = CONVERT(date, DATEADD(day, -1, GETDATE()))`
  },
  'Open Invoices': {
    sql: `SELECT COUNT(*) as value FROM dbo.invoice_hdr WITH (NOLOCK) WHERE invoice_date >= DATEADD(month, -1, GETDATE())`
  },
  'Orders Backlogged': {
    sql: `SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE completed = 'N' AND order_date >= DATEADD(day, -30, GETDATE())`
  },
  'Total Monthly Sales': {
    sql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_no = l.order_no WHERE h.order_date >= DATEADD(day, -30, GETDATE())`
  }
};

// Main function
async function updateSchemaPrefix() {
  console.log('=== UPDATING SCHEMA PREFIXES IN SQL EXPRESSIONS ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');
  
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
    
    // Check if chart_data table exists
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'");
    
    if (tables.length === 0) {
      console.error('chart_data table not found. Please run find-chart-data.js first.');
      return;
    }
    
    console.log('chart_data table found. Updating SQL expressions with schema prefixes...');
    
    // Get all rows from the chart_data table
    const rows = await runQuery(db, 'SELECT * FROM chart_data');
    console.log(`Found ${rows.length} rows in chart_data table.`);
    
    // Update each row with the correct SQL expression
    let updatedCount = 0;
    
    for (const row of rows) {
      const variableName = row.variable_name;
      
      if (correctSqlExpressions[variableName]) {
        const correctSql = correctSqlExpressions[variableName].sql;
        
        await runUpdate(db, `
          UPDATE chart_data
          SET 
            sql_expression = ?,
            production_sql_expression = ?
          WHERE id = ?
        `, [
          correctSql,
          correctSql,
          row.id
        ]);
        
        console.log(`Updated SQL expressions for ${variableName}`);
        updatedCount++;
      }
    }
    
    console.log(`\nUpdated ${updatedCount} rows with schema prefixes.`);
    
    // Verify the updates
    console.log('\nVerifying updates...');
    
    const updatedRows = await runQuery(db, 'SELECT * FROM chart_data');
    
    for (let i = 0; i < Math.min(updatedRows.length, 7); i++) {
      const row = updatedRows[i];
      console.log(`\n--- Row ${i+1} ---`);
      console.log(`ID: ${row.id}`);
      console.log(`Variable Name: ${row.variable_name}`);
      console.log(`SQL Expression: ${row.sql_expression}`);
    }
    
    console.log('\nUpdate completed successfully.');
    
  } catch (error) {
    console.error('Error updating schema prefixes:', error);
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

// Run the function
updateSchemaPrefix().catch(error => {
  console.error('Unhandled error:', error);
});
