// Script to check database structure and verify SQL expressions
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

try {
  console.log(`Checking database at: ${dbPath}`);
  
  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at: ${dbPath}`);
    process.exit(1);
  }
  
  // Open the database
  const db = new Database(dbPath);
  
  // List all tables
  console.log('\n=== DATABASE TABLES ===');
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // Check if chart_data table exists
  if (!tables.some(t => t.name === 'chart_data')) {
    console.error('Error: chart_data table not found in database');
    process.exit(1);
  }
  
  // Get chart_data table schema
  console.log('\n=== CHART_DATA TABLE SCHEMA ===');
  const schema = db.prepare(`PRAGMA table_info(chart_data)`).all();
  schema.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  // Check if production_sql_expression column exists
  const hasProdSqlExpr = schema.some(col => col.name === 'production_sql_expression');
  console.log(`\nProduction SQL Expression column exists: ${hasProdSqlExpr ? 'YES' : 'NO'}`);
  
  if (!hasProdSqlExpr) {
    console.error('Error: production_sql_expression column not found in chart_data table');
    console.log('You may need to run the update-db-schema.js script to add this column');
  } else {
    // Check for null values in production_sql_expression
    const nullCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM chart_data 
      WHERE production_sql_expression IS NULL OR production_sql_expression = ''
    `).get().count;
    
    console.log(`Rows with missing production_sql_expression: ${nullCount}`);
    
    if (nullCount > 0) {
      console.log('\n=== ROWS WITH MISSING PRODUCTION SQL EXPRESSION ===');
      const nullRows = db.prepare(`
        SELECT id, chart_name, variable_name 
        FROM chart_data 
        WHERE production_sql_expression IS NULL OR production_sql_expression = ''
        LIMIT 10
      `).all();
      
      nullRows.forEach(row => {
        console.log(`- Row ${row.id}: ${row.chart_name} - ${row.variable_name}`);
      });
    }
  }
  
  // Sample data check
  console.log('\n=== SAMPLE DATA CHECK ===');
  const sampleRows = db.prepare(`
    SELECT id, chart_name, variable_name, server_name, 
           SUBSTR(production_sql_expression, 1, 50) as prod_sql_short
    FROM chart_data
    LIMIT 5
  `).all();
  
  sampleRows.forEach(row => {
    console.log(`\nRow ID: ${row.id}`);
    console.log(`Chart: ${row.chart_name}`);
    console.log(`Variable: ${row.variable_name}`);
    console.log(`Server: ${row.server_name}`);
    console.log(`Production SQL (truncated): ${row.prod_sql_short}...`);
  });
  
  // Check for test_data_mapping table
  console.log('\n=== TEST DATA MAPPING ===');
  const hasTestMapping = tables.some(t => t.name === 'test_data_mapping');
  console.log(`Test data mapping table exists: ${hasTestMapping ? 'YES' : 'NO'}`);
  
  if (hasTestMapping) {
    const testCount = db.prepare(`SELECT COUNT(*) as count FROM test_data_mapping`).get().count;
    console.log(`Number of test data mappings: ${testCount}`);
    
    if (testCount > 0) {
      const testSample = db.prepare(`SELECT id, test_value FROM test_data_mapping LIMIT 5`).all();
      console.log('\nSample test data mappings:');
      testSample.forEach(row => {
        console.log(`- ${row.id}: ${row.test_value}`);
      });
    }
  }
  
  // Close the database connection
  db.close();
  console.log('\nDatabase check completed successfully');
} catch (error) {
  console.error('Error checking database:', error);
}
