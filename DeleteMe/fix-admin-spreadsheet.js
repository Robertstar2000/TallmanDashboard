/**
 * Script to examine and fix the admin spreadsheet SQL expressions in the database
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

// Main function to fix the admin spreadsheet
async function fixAdminSpreadsheet() {
  console.log('Starting admin spreadsheet fix...');
  
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
    // Get all tables in the database
    const tables = await runQuery(db, "SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name).join(', '));
    
    // Find the admin spreadsheet table
    let adminTableName = null;
    const possibleTableNames = ['admin_spreadsheet', 'spreadsheet', 'admin_data', 'dashboard_data'];
    
    for (const tableName of possibleTableNames) {
      try {
        const tableExists = await runQuery(db, `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
        if (tableExists.length > 0) {
          adminTableName = tableName;
          console.log(`Found admin spreadsheet table: ${adminTableName}`);
          break;
        }
      } catch (error) {
        // Table doesn't exist, continue to next one
      }
    }
    
    if (!adminTableName) {
      // If we can't find a specific admin table, list all tables and their schemas
      console.log('Could not find admin spreadsheet table. Listing all tables and their schemas:');
      
      for (const table of tables) {
        const schema = await runQuery(db, `PRAGMA table_info(${table.name})`);
        console.log(`\nTable: ${table.name}`);
        console.log('Columns:', schema.map(col => `${col.name} (${col.type})`).join(', '));
        
        // Check if this table has SQL-related columns
        const hasSqlColumns = schema.some(col => 
          col.name.toLowerCase().includes('sql') || 
          col.name.toLowerCase().includes('query') || 
          col.name.toLowerCase().includes('expression')
        );
        
        if (hasSqlColumns) {
          console.log('This table has SQL-related columns, showing sample data:');
          const sampleData = await runQuery(db, `SELECT * FROM ${table.name} LIMIT 5`);
          console.log(JSON.stringify(sampleData, null, 2));
          
          // This might be our admin table
          adminTableName = table.name;
        }
      }
    }
    
    if (!adminTableName) {
      console.error('Could not identify the admin spreadsheet table. Exiting.');
      return;
    }
    
    // Get the schema of the admin spreadsheet table
    const schema = await runQuery(db, `PRAGMA table_info(${adminTableName})`);
    console.log(`\nAdmin spreadsheet table (${adminTableName}) schema:`);
    console.log(schema.map(col => `${col.name} (${col.type})`).join(', '));
    
    // Find the SQL expression columns
    const sqlColumns = schema.filter(col => 
      col.name.toLowerCase().includes('sql') || 
      col.name.toLowerCase().includes('query') || 
      col.name.toLowerCase().includes('expression')
    );
    
    if (sqlColumns.length === 0) {
      console.error('Could not find SQL expression columns in the admin spreadsheet table. Exiting.');
      return;
    }
    
    console.log('SQL expression columns:', sqlColumns.map(col => col.name).join(', '));
    
    // Get all rows from the admin spreadsheet
    const rows = await runQuery(db, `SELECT * FROM ${adminTableName}`);
    console.log(`\nFound ${rows.length} rows in the admin spreadsheet.`);
    
    // Find the key metrics rows that need fixing
    const keyMetricsRows = rows.filter(row => 
      row.chartName === 'Key Metrics' || 
      (row.chart_name === 'Key Metrics') ||
      (row.name && row.name.includes('Key Metrics'))
    );
    
    console.log(`Found ${keyMetricsRows.length} Key Metrics rows.`);
    
    if (keyMetricsRows.length === 0) {
      // Try to find rows by variable name instead
      const metricRows = rows.filter(row => 
        row.variableName === 'Total Orders' || 
        row.variable_name === 'Total Orders' ||
        (row.name && row.name.includes('Total Orders'))
      );
      
      if (metricRows.length > 0) {
        console.log(`Found ${metricRows.length} rows matching 'Total Orders'.`);
        console.log('First matching row:', JSON.stringify(metricRows[0], null, 2));
      } else {
        console.log('Could not find any rows matching Key Metrics or Total Orders.');
        console.log('Sample row from database:', JSON.stringify(rows[0], null, 2));
      }
    }
    
    // Identify the SQL columns to update
    let sqlExpressionCol = null;
    let productionSqlExpressionCol = null;
    
    // Find the column names based on the schema
    for (const col of sqlColumns) {
      if (col.name.toLowerCase().includes('production')) {
        productionSqlExpressionCol = col.name;
      } else {
        sqlExpressionCol = col.name;
      }
    }
    
    // If we couldn't identify the columns, try to infer them from the data
    if (!sqlExpressionCol || !productionSqlExpressionCol) {
      const sampleRow = rows[0];
      const keys = Object.keys(sampleRow);
      
      for (const key of keys) {
        const value = sampleRow[key];
        if (typeof value === 'string' && value.toLowerCase().includes('select') && value.toLowerCase().includes('from')) {
          if (key.toLowerCase().includes('production')) {
            productionSqlExpressionCol = key;
          } else {
            sqlExpressionCol = key;
          }
        }
      }
    }
    
    console.log(`SQL expression columns identified: test=${sqlExpressionCol}, production=${productionSqlExpressionCol}`);
    
    // Define the correct SQL expressions for each metric
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
    
    // Update the SQL expressions for each key metric
    let updatedCount = 0;
    
    for (const row of rows) {
      // Determine the variable name
      const variableName = row.variableName || row.variable_name || row.name;
      
      if (variableName && correctSqlExpressions[variableName]) {
        const correctExpressions = correctSqlExpressions[variableName];
        
        // Check if the SQL expressions need updating
        const currentSql = row[sqlExpressionCol];
        const currentProductionSql = row[productionSqlExpressionCol];
        
        let needsUpdate = false;
        
        // For Total Orders, always update to ensure date filter
        if (variableName === 'Total Orders') {
          needsUpdate = true;
        } else {
          // For other metrics, check if the current expressions are missing schema prefixes
          needsUpdate = (
            !currentSql?.includes('dbo.') ||
            !currentProductionSql?.includes('dbo.')
          );
        }
        
        if (needsUpdate) {
          console.log(`Updating SQL expressions for ${variableName}...`);
          
          // Prepare the update query
          let updateQuery = `UPDATE ${adminTableName} SET `;
          const updateParams = [];
          
          if (sqlExpressionCol) {
            updateQuery += `${sqlExpressionCol} = ? `;
            updateParams.push(correctExpressions.sql);
          }
          
          if (productionSqlExpressionCol) {
            if (updateParams.length > 0) {
              updateQuery += ', ';
            }
            updateQuery += `${productionSqlExpressionCol} = ? `;
            updateParams.push(correctExpressions.productionSql);
          }
          
          // Add the WHERE clause to identify the specific row
          const idColumn = row.id ? 'id' : (row.ID ? 'ID' : 'rowid');
          updateQuery += `WHERE ${idColumn} = ?`;
          updateParams.push(row.id || row.ID || row.rowid);
          
          try {
            const result = await runUpdate(db, updateQuery, updateParams);
            console.log(`Updated ${result.changes} rows for ${variableName}`);
            updatedCount += result.changes;
          } catch (error) {
            console.error(`Error updating ${variableName}:`, error.message);
          }
        }
      }
    }
    
    console.log(`\nUpdated ${updatedCount} SQL expressions in the admin spreadsheet.`);
    
    // Verify the updates
    console.log('\nVerifying updates...');
    const updatedRows = await runQuery(db, `SELECT * FROM ${adminTableName}`);
    
    for (const row of updatedRows) {
      const variableName = row.variableName || row.variable_name || row.name;
      
      if (variableName && correctSqlExpressions[variableName]) {
        const currentSql = row[sqlExpressionCol];
        const currentProductionSql = row[productionSqlExpressionCol];
        
        console.log(`\n${variableName}:`);
        console.log(`Test SQL: ${currentSql}`);
        console.log(`Production SQL: ${currentProductionSql}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
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

// Run the fix
fixAdminSpreadsheet().catch(error => {
  console.error('Unhandled error:', error);
});
