// Script to check the database schema and write results to a file
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Connect to the database
const db = new Database('./data/dashboard.db');
const outputFile = './db-schema-check.txt';
let output = '';

function log(message) {
  output += message + '\n';
}

try {
  log('Connected to the database at ' + path.resolve('./data/dashboard.db'));
  
  // Check if chart_name or chart_group column exists
  const pragmaResult = db.prepare("PRAGMA table_info(chart_data)").all();
  log('\nColumns in chart_data table:');
  pragmaResult.forEach(col => {
    log(`${col.cid}: ${col.name} (${col.type})`);
  });
  
  // Check for chart_name column
  const hasChartName = pragmaResult.some(col => col.name === 'chart_name');
  const hasChartGroup = pragmaResult.some(col => col.name === 'chart_group');
  
  log(`\nHas chart_name column: ${hasChartName}`);
  log(`Has chart_group column: ${hasChartGroup}`);
  
  // Check AR Aging queries
  log('\nAR Aging Queries:');
  const arAgingRows = db.prepare("SELECT id, chart_group, variable_name, server_name, sql_expression, production_sql_expression FROM chart_data WHERE chart_group = 'AR Aging'").all();
  
  if (arAgingRows.length === 0) {
    log('No AR Aging rows found');
  } else {
    arAgingRows.forEach(row => {
      log(`\nID: ${row.id}`);
      log(`Chart Group: ${row.chart_group}`);
      log(`Variable: ${row.variable_name}`);
      log(`Server: ${row.server_name}`);
      log(`Test SQL: ${row.sql_expression || 'Not set'}`);
      log(`Production SQL: ${row.production_sql_expression || 'Not set'}`);
    });
  }
  
  // Write output to file
  fs.writeFileSync(outputFile, output);
  console.log(`Results written to ${outputFile}`);
  
} catch (err) {
  console.error('Error:', err.message);
  fs.writeFileSync(outputFile, output + '\nERROR: ' + err.message);
} finally {
  // Close the database connection
  db.close();
}
