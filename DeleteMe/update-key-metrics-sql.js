/**
 * Script to update the SQL expressions for key metrics in the dashboard database
 * This ensures that all SQL queries have the correct schema prefixes and date filters
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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
  'Open Orders 2': { // Alternative name for Open Orders Value
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
    productionSql: `SELECT ISNULL(SUM(l.extended_price), 0) as value FROM dbo.oe_hdr h WITH (NOLOCK) JOIN dbo.oe_line l WITH (NOLOCK) ON h.order_date >= DATEADD(day, -30, GETDATE()))`
  }
};

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
    
    // Get all tables in the database
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name).join(', '));
    
    // Find tables that might contain the admin spreadsheet data
    let spreadsheetTable = null;
    let sqlExpressionColumn = null;
    let productionSqlExpressionColumn = null;
    let variableNameColumn = null;
    let idColumn = null;
    
    // Check each table for SQL-related columns
    for (const table of tables) {
      const tableName = table.name;
      
      // Skip system tables
      if (tableName === 'sqlite_sequence') continue;
      
      // Get table schema
      const schema = await runQuery(db, `PRAGMA table_info(${tableName})`);
      
      // Check for SQL-related columns
      const sqlColumns = schema.filter(col => 
        col.name.toLowerCase().includes('sql') || 
        col.name.toLowerCase().includes('query') || 
        col.name.toLowerCase().includes('expression')
      );
      
      // Check for variable name column
      const nameColumns = schema.filter(col => 
        col.name.toLowerCase().includes('variable') || 
        col.name.toLowerCase().includes('name')
      );
      
      // Check for ID column
      const idColumns = schema.filter(col => 
        col.name.toLowerCase() === 'id' || 
        col.name.toLowerCase() === 'rowid'
      );
      
      if (sqlColumns.length > 0 && nameColumns.length > 0 && idColumns.length > 0) {
        // This table might contain the admin spreadsheet data
        spreadsheetTable = tableName;
        
        // Find the SQL expression columns
        for (const col of sqlColumns) {
          if (col.name.toLowerCase().includes('production')) {
            productionSqlExpressionColumn = col.name;
          } else {
            sqlExpressionColumn = col.name;
          }
        }
        
        // Find the variable name column
        for (const col of nameColumns) {
          if (col.name.toLowerCase().includes('variable')) {
            variableNameColumn = col.name;
            break;
          }
        }
        
        // If we didn't find a variable name column, use the first name column
        if (!variableNameColumn && nameColumns.length > 0) {
          variableNameColumn = nameColumns[0].name;
        }
        
        // Find the ID column
        idColumn = idColumns[0].name;
        
        console.log(`Found potential spreadsheet table: ${spreadsheetTable}`);
        console.log(`SQL expression column: ${sqlExpressionColumn}`);
        console.log(`Production SQL expression column: ${productionSqlExpressionColumn}`);
        console.log(`Variable name column: ${variableNameColumn}`);
        console.log(`ID column: ${idColumn}`);
        
        // Check if this table contains key metrics data
        const keyMetricsRows = await runQuery(db, `
          SELECT * FROM ${spreadsheetTable} 
          WHERE ${variableNameColumn} LIKE '%Total Orders%' 
          OR ${variableNameColumn} LIKE '%Open Orders%'
          OR ${variableNameColumn} LIKE '%Daily Revenue%'
          OR ${variableNameColumn} LIKE '%Open Invoices%'
          OR ${variableNameColumn} LIKE '%Orders Backlogged%'
          OR ${variableNameColumn} LIKE '%Total Monthly Sales%'
          LIMIT 1
        `);
        
        if (keyMetricsRows.length > 0) {
          console.log(`Found key metrics data in table ${spreadsheetTable}`);
          break;
        } else {
          // Reset variables and continue searching
          spreadsheetTable = null;
          sqlExpressionColumn = null;
          productionSqlExpressionColumn = null;
          variableNameColumn = null;
          idColumn = null;
        }
      }
    }
    
    if (!spreadsheetTable) {
      console.error('Could not find a table containing key metrics data. Exiting.');
      return;
    }
    
    // Get all rows from the spreadsheet table
    const rows = await runQuery(db, `SELECT * FROM ${spreadsheetTable}`);
    console.log(`Found ${rows.length} rows in table ${spreadsheetTable}`);
    
    // Update each key metric row with the correct SQL expressions
    let updatedCount = 0;
    
    for (const row of rows) {
      const variableName = row[variableNameColumn];
      
      // Skip rows that don't have a variable name
      if (!variableName) continue;
      
      // Find the matching key metric
      let matchingMetric = null;
      for (const [metricName, expressions] of Object.entries(correctSqlExpressions)) {
        if (variableName.includes(metricName)) {
          matchingMetric = metricName;
          break;
        }
      }
      
      if (matchingMetric) {
        console.log(`Updating SQL expressions for ${variableName}...`);
        
        const correctExpressions = correctSqlExpressions[matchingMetric];
        
        // Update the SQL expressions
        if (sqlExpressionColumn && productionSqlExpressionColumn) {
          const result = await runUpdate(db, `
            UPDATE ${spreadsheetTable}
            SET 
              ${sqlExpressionColumn} = ?,
              ${productionSqlExpressionColumn} = ?
            WHERE ${idColumn} = ?
          `, [
            correctExpressions.sql,
            correctExpressions.productionSql,
            row[idColumn]
          ]);
          
          console.log(`Updated ${result.changes} rows for ${variableName}`);
          updatedCount += result.changes;
        } else if (productionSqlExpressionColumn) {
          // If only production SQL column exists
          const result = await runUpdate(db, `
            UPDATE ${spreadsheetTable}
            SET ${productionSqlExpressionColumn} = ?
            WHERE ${idColumn} = ?
          `, [
            correctExpressions.productionSql,
            row[idColumn]
          ]);
          
          console.log(`Updated ${result.changes} rows for ${variableName} (production SQL only)`);
          updatedCount += result.changes;
        }
      }
    }
    
    console.log(`\nUpdated ${updatedCount} SQL expressions in the database`);
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const updatedRows = await runQuery(db, `
      SELECT ${idColumn}, ${variableNameColumn}, ${sqlExpressionColumn || 'NULL'}, ${productionSqlExpressionColumn || 'NULL'}
      FROM ${spreadsheetTable}
      WHERE ${variableNameColumn} LIKE '%Total Orders%' 
      OR ${variableNameColumn} LIKE '%Open Orders%'
      OR ${variableNameColumn} LIKE '%Daily Revenue%'
      OR ${variableNameColumn} LIKE '%Open Invoices%'
      OR ${variableNameColumn} LIKE '%Orders Backlogged%'
      OR ${variableNameColumn} LIKE '%Total Monthly Sales%'
    `);
    
    for (const row of updatedRows) {
      console.log(`\n${row[variableNameColumn]}:`);
      if (sqlExpressionColumn) {
        console.log(`Test SQL: ${row[sqlExpressionColumn]}`);
      }
      if (productionSqlExpressionColumn) {
        console.log(`Production SQL: ${row[productionSqlExpressionColumn]}`);
      }
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
