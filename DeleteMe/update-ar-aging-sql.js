// Script to update AR Aging SQL expressions
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Path to the initial-data.ts file
const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// SQL expressions for AR Aging
const arAgingSqlExpressions = [
  {
    variableName: 'Current',
    sqlExpression: "SELECT SUM(current_due) as value FROM invoice_hdr WHERE current_due > 0",
    productionSqlExpression: "SELECT SUM(current_due) as value FROM invoice_hdr WHERE current_due > 0",
    tableName: "invoice_hdr"
  },
  {
    variableName: '1-30 Days',
    sqlExpression: "SELECT SUM(past_due_1_30) as value FROM invoice_hdr WHERE past_due_1_30 > 0",
    productionSqlExpression: "SELECT SUM(past_due_1_30) as value FROM invoice_hdr WHERE past_due_1_30 > 0",
    tableName: "invoice_hdr"
  },
  {
    variableName: '31-60 Days',
    sqlExpression: "SELECT SUM(past_due_31_60) as value FROM invoice_hdr WHERE past_due_31_60 > 0",
    productionSqlExpression: "SELECT SUM(past_due_31_60) as value FROM invoice_hdr WHERE past_due_31_60 > 0",
    tableName: "invoice_hdr"
  },
  {
    variableName: '61-90 Days',
    sqlExpression: "SELECT SUM(past_due_61_90) as value FROM invoice_hdr WHERE past_due_61_90 > 0",
    productionSqlExpression: "SELECT SUM(past_due_61_90) as value FROM invoice_hdr WHERE past_due_61_90 > 0",
    tableName: "invoice_hdr"
  },
  {
    variableName: '90+ Days',
    sqlExpression: "SELECT SUM(past_due_over_90) as value FROM invoice_hdr WHERE past_due_over_90 > 0",
    productionSqlExpression: "SELECT SUM(past_due_over_90) as value FROM invoice_hdr WHERE past_due_over_90 > 0",
    tableName: "invoice_hdr"
  }
];

// Read the initial-data.ts file
fs.readFile(initialDataPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading initial-data.ts:', err.message);
    return;
  }
  
  console.log('Successfully read initial-data.ts');
  
  let updatedData = data;
  let updatedCount = 0;
  
  // Update each AR Aging row in the file
  arAgingSqlExpressions.forEach(expr => {
    // Create a regex pattern to find the row with the matching variableName and chartGroup
    const pattern = new RegExp(`({\\s*id:\\s*['"]row_\\d+['"],\\s*name:\\s*['"].*?['"],\\s*chartGroup:\\s*['"]AR Aging['"],\\s*variableName:\\s*['"]${expr.variableName}['"].*?})`, 's');
    
    const match = updatedData.match(pattern);
    if (match) {
      let rowData = match[1];
      
      // Update the SQL expressions and table name
      rowData = rowData.replace(/sqlExpression:\s*".*?"/, `sqlExpression: "${expr.sqlExpression}"`);
      rowData = rowData.replace(/productionSqlExpression:\s*".*?"/, `productionSqlExpression: "${expr.productionSqlExpression}"`);
      rowData = rowData.replace(/tableName:\s*".*?"/, `tableName: "${expr.tableName}"`);
      
      // Replace the row in the file
      updatedData = updatedData.replace(pattern, rowData);
      updatedCount++;
      
      console.log(`Updated row for '${expr.variableName}'`);
    } else {
      console.log(`Could not find row for '${expr.variableName}'`);
    }
  });
  
  // Write the updated file
  if (updatedCount > 0) {
    fs.writeFile(initialDataPath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing initial-data.ts:', err.message);
        return;
      }
      
      console.log(`Successfully updated ${updatedCount} rows in initial-data.ts`);
    });
  } else {
    console.log('No rows were updated in initial-data.ts');
  }
});

// Also update the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database.');
  
  // Get all AR Aging rows from the database
  db.all("SELECT id, variable_name FROM chart_data WHERE chart_group = 'AR Aging'", (err, rows) => {
    if (err) {
      console.error('Error getting AR Aging rows:', err.message);
      db.close();
      return;
    }
    
    console.log(`Found ${rows.length} AR Aging rows in the database`);
    
    if (rows.length === 0) {
      console.log('No AR Aging rows found in the database');
      db.close();
      return;
    }
    
    // Start a transaction
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err.message);
        db.close();
        return;
      }
      
      let updatedRows = 0;
      
      // Update each row with the new SQL expressions
      rows.forEach(row => {
        const expr = arAgingSqlExpressions.find(e => e.variableName === row.variable_name);
        if (!expr) {
          console.log(`No SQL expression found for variable ${row.variable_name}`);
          return;
        }
        
        db.run(`
          UPDATE chart_data
          SET sql_expression = ?,
              production_sql_expression = ?,
              db_table_name = ?
          WHERE id = ?
        `, [
          expr.sqlExpression,
          expr.productionSqlExpression,
          expr.tableName,
          row.id
        ], function(err) {
          if (err) {
            console.error(`Error updating row ${row.id}:`, err.message);
            db.run('ROLLBACK');
            db.close();
            return;
          }
          
          updatedRows++;
          console.log(`Updated database row ${row.id} (${row.variable_name})`);
          
          if (updatedRows === rows.length) {
            // Commit the transaction
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err.message);
                db.run('ROLLBACK');
                db.close();
                return;
              }
              
              console.log('Transaction committed');
              console.log(`Successfully updated ${updatedRows} rows in the database`);
              db.close();
            });
          }
        });
      });
    });
  });
});
