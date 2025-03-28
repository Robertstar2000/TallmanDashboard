// Script to fix AR Aging SQL expressions in the database
const Database = require('better-sqlite3');
const fs = require('fs');

// Connect to the local SQLite database
const db = new Database('./data/dashboard.db');
const logFile = './ar-aging-fix-log.txt';
let output = '';

function log(message) {
  console.log(message);
  output += message + '\n';
}

try {
  log('Starting AR Aging query fixes...');
  
  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  // Get AR Aging rows
  const arAgingRows = db.prepare(`
    SELECT id, chart_group, variable_name, server_name, sql_expression, production_sql_expression 
    FROM chart_data 
    WHERE chart_group = 'AR Aging'
  `).all();
  
  if (arAgingRows.length === 0) {
    log('No AR Aging rows found in the database.');
    fs.writeFileSync(logFile, output);
    db.prepare('ROLLBACK').run();
    db.close();
    return;
  }
  
  log(`Found ${arAgingRows.length} AR Aging rows to fix.`);
  
  // Updated SQL expressions with alternative table name and schema options
  const fixedExpressions = {
    'Current': {
      test: "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due = 0",
      prod: "SELECT ISNULL(SUM(amount_open), 0) as value FROM ar_open_items WHERE days_past_due = 0"
    },
    '1-30 Days': {
      test: "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 0 AND days_past_due <= 30",
      prod: "SELECT ISNULL(SUM(amount_open), 0) as value FROM ar_open_items WHERE days_past_due > 0 AND days_past_due <= 30"
    },
    '31-60 Days': {
      test: "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 30 AND days_past_due <= 60",
      prod: "SELECT ISNULL(SUM(amount_open), 0) as value FROM ar_open_items WHERE days_past_due > 30 AND days_past_due <= 60"
    },
    '61-90 Days': {
      test: "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 60 AND days_past_due <= 90",
      prod: "SELECT ISNULL(SUM(amount_open), 0) as value FROM ar_open_items WHERE days_past_due > 60 AND days_past_due <= 90"
    },
    '90+ Days': {
      test: "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 90",
      prod: "SELECT ISNULL(SUM(amount_open), 0) as value FROM ar_open_items WHERE days_past_due > 90"
    }
  };
  
  // Update each AR Aging row
  for (const row of arAgingRows) {
    log(`\nFixing queries for ${row.variable_name}:`);
    
    if (fixedExpressions[row.variable_name]) {
      const fixedTest = fixedExpressions[row.variable_name].test;
      const fixedProd = fixedExpressions[row.variable_name].prod;
      
      // Log the changes
      log(`Original test SQL: ${row.sql_expression || 'Not set'}`);
      log(`Fixed test SQL: ${fixedTest}`);
      log(`Original production SQL: ${row.production_sql_expression || 'Not set'}`);
      log(`Fixed production SQL: ${fixedProd}`);
      
      // Update the row
      db.prepare(`
        UPDATE chart_data 
        SET sql_expression = ?, production_sql_expression = ? 
        WHERE id = ?
      `).run(fixedTest, fixedProd, row.id);
      
      log(`Updated SQL expressions for ${row.variable_name}`);
    } else {
      log(`No fixed expressions found for ${row.variable_name}, skipping.`);
    }
  }
  
  // Commit the transaction
  db.prepare('COMMIT').run();
  log('\nAR Aging query fixes completed successfully.');
  
} catch (error) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  log(`\nError fixing AR Aging queries: ${error.message}`);
  if (error.stack) {
    log(`Stack trace: ${error.stack}`);
  }
} finally {
  // Close the database connection
  db.close();
  
  // Write output to log file
  fs.writeFileSync(logFile, output);
  console.log(`Results written to ${logFile}`);
}
