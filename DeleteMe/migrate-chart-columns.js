// Script to migrate chart_name to chart_group in the database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Connect to the database
const db = new Database('./data/dashboard.db');
const logFile = './migration-log.txt';
let output = '';

function log(message) {
  output += message + '\n';
  console.log(message);
}

try {
  log('Connected to the database at ' + path.resolve('./data/dashboard.db'));
  
  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  // First, make sure all chart_group values are populated from chart_name if missing
  const updateMissingChartGroups = db.prepare(`
    UPDATE chart_data 
    SET chart_group = chart_name 
    WHERE chart_group IS NULL OR chart_group = ''
  `);
  const missingGroupsResult = updateMissingChartGroups.run();
  log(`Updated ${missingGroupsResult.changes} rows with missing chart_group values`);
  
  // Now check if there are any rows where chart_name and chart_group differ
  const diffRows = db.prepare(`
    SELECT id, chart_name, chart_group 
    FROM chart_data 
    WHERE chart_name != chart_group
  `).all();
  
  if (diffRows.length > 0) {
    log(`\nFound ${diffRows.length} rows where chart_name and chart_group differ:`);
    diffRows.forEach(row => {
      log(`ID: ${row.id}, chart_name: "${row.chart_name}", chart_group: "${row.chart_group}"`);
    });
    
    // Update these rows to use chart_group consistently
    const updateDiffRows = db.prepare(`
      UPDATE chart_data 
      SET chart_name = chart_group 
      WHERE chart_name != chart_group
    `);
    const diffUpdateResult = updateDiffRows.run();
    log(`Updated ${diffUpdateResult.changes} rows to make chart_name match chart_group`);
  } else {
    log('\nAll rows have consistent chart_name and chart_group values');
  }
  
  // Check AR Aging queries to ensure they are correct
  log('\nChecking AR Aging queries:');
  const arAgingRows = db.prepare(`
    SELECT id, chart_group, variable_name, server_name, sql_expression, production_sql_expression 
    FROM chart_data 
    WHERE chart_group = 'AR Aging'
  `).all();
  
  // Verify and fix AR Aging SQL expressions
  for (const row of arAgingRows) {
    log(`\nChecking AR Aging row ${row.id} - ${row.variable_name}`);
    
    // Check test SQL
    let testSqlUpdated = false;
    if (!row.sql_expression || !row.sql_expression.includes('COALESCE(SUM(amount_open), 0)')) {
      let newTestSql = '';
      
      // Generate correct test SQL based on variable name
      if (row.variable_name === 'Current') {
        newTestSql = "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due = 0";
      } else if (row.variable_name === '1-30 Days') {
        newTestSql = "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 0 AND days_past_due <= 30";
      } else if (row.variable_name === '31-60 Days') {
        newTestSql = "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 30 AND days_past_due <= 60";
      } else if (row.variable_name === '61-90 Days') {
        newTestSql = "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 60 AND days_past_due <= 90";
      } else if (row.variable_name === '90+ Days') {
        newTestSql = "SELECT COALESCE(SUM(amount_open), 0) as value FROM pub_ar_open_items WHERE days_past_due > 90";
      }
      
      if (newTestSql) {
        // Update the test SQL
        db.prepare(`
          UPDATE chart_data 
          SET sql_expression = ? 
          WHERE id = ?
        `).run(newTestSql, row.id);
        
        log(`Updated test SQL for ${row.variable_name}`);
        log(`Old: ${row.sql_expression || 'Not set'}`);
        log(`New: ${newTestSql}`);
        testSqlUpdated = true;
      }
    }
    
    // Check production SQL
    let prodSqlUpdated = false;
    if (!row.production_sql_expression || !row.production_sql_expression.includes('ISNULL(SUM(amount_open), 0)')) {
      let newProdSql = '';
      
      // Generate correct production SQL based on variable name
      if (row.variable_name === 'Current') {
        newProdSql = "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due = 0";
      } else if (row.variable_name === '1-30 Days') {
        newProdSql = "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 0 AND days_past_due <= 30";
      } else if (row.variable_name === '31-60 Days') {
        newProdSql = "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 30 AND days_past_due <= 60";
      } else if (row.variable_name === '61-90 Days') {
        newProdSql = "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 60 AND days_past_due <= 90";
      } else if (row.variable_name === '90+ Days') {
        newProdSql = "SELECT ISNULL(SUM(amount_open), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 90";
      }
      
      if (newProdSql) {
        // Update the production SQL
        db.prepare(`
          UPDATE chart_data 
          SET production_sql_expression = ? 
          WHERE id = ?
        `).run(newProdSql, row.id);
        
        log(`Updated production SQL for ${row.variable_name}`);
        log(`Old: ${row.production_sql_expression || 'Not set'}`);
        log(`New: ${newProdSql}`);
        prodSqlUpdated = true;
      }
    }
    
    if (!testSqlUpdated && !prodSqlUpdated) {
      log(`No SQL updates needed for ${row.variable_name}`);
    }
  }
  
  // Commit the transaction
  db.prepare('COMMIT').run();
  log('\nMigration completed successfully');
  
  // Write output to log file
  fs.writeFileSync(logFile, output);
  console.log(`Results written to ${logFile}`);
  
} catch (err) {
  // Rollback on error
  db.prepare('ROLLBACK').run();
  console.error('Error:', err.message);
  output += '\nERROR: ' + err.message;
  fs.writeFileSync(logFile, output);
} finally {
  // Close the database connection
  db.close();
}
