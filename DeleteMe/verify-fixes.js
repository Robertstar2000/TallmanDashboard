// Script to verify that our fixes for SQL expressions and test mode values are working
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Checking database at: ${dbPath}`);

async function main() {
  try {
    const db = sqlite3(dbPath);
    
    // 1. Check database schema
    console.log('\n=== DATABASE SCHEMA ===');
    const columns = db.prepare("PRAGMA table_info(chart_data)").all();
    const hasSqlExpr = columns.some(col => col.name === 'sql_expression');
    const hasProdSqlExpr = columns.some(col => col.name === 'production_sql_expression');
    
    console.log(`SQL Expression columns:`);
    console.log(`- sql_expression: ${hasSqlExpr ? 'Present' : 'Missing'}`);
    console.log(`- production_sql_expression: ${hasProdSqlExpr ? 'Present' : 'Missing'}`);
    
    // 2. Check for empty SQL expressions
    console.log('\n=== SQL EXPRESSION CONTENT CHECK ===');
    
    // Check for rows with empty sql_expression
    if (hasSqlExpr) {
      const emptySqlExprCount = db.prepare(`
        SELECT COUNT(*) as count FROM chart_data 
        WHERE sql_expression IS NULL OR sql_expression = ''
      `).get().count;
      console.log(`Rows with empty sql_expression: ${emptySqlExprCount}`);
    }
    
    // Check for rows with empty production_sql_expression
    if (hasProdSqlExpr) {
      const emptyProdSqlExprCount = db.prepare(`
        SELECT COUNT(*) as count FROM chart_data 
        WHERE production_sql_expression IS NULL OR production_sql_expression = ''
      `).get().count;
      console.log(`Rows with empty production_sql_expression: ${emptyProdSqlExprCount}`);
    }
    
    // 3. Check test_data_mapping table
    console.log('\n=== TEST DATA MAPPING ===');
    const testTableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'
    `).get();
    
    if (testTableExists) {
      const testCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
      console.log(`Test data mapping table exists with ${testCount} entries`);
      
      // Get total rows in chart_data
      const totalRows = db.prepare('SELECT COUNT(*) as count FROM chart_data').get().count;
      console.log(`Total rows in chart_data: ${totalRows}`);
      
      if (testCount < totalRows) {
        console.log(`WARNING: Not all chart_data rows have test data mappings (${testCount}/${totalRows})`);
      } else {
        console.log(`All chart_data rows have test data mappings`);
      }
      
      // Sample test data
      const testData = db.prepare('SELECT id, test_value FROM test_data_mapping LIMIT 5').all();
      console.log('\nSample test data:');
      testData.forEach(row => {
        console.log(`- ${row.id}: ${row.test_value}`);
      });
    } else {
      console.log('Test data mapping table does not exist!');
    }
    
    // 4. Simulate query execution for a few rows
    console.log('\n=== SIMULATING QUERY EXECUTION ===');
    
    // Get a few sample rows
    const rows = db.prepare(`
      SELECT 
        id, 
        chart_name as "chartName", 
        variable_name as "variableName", 
        server_name as "serverName", 
        sql_expression as "sqlExpression", 
        production_sql_expression as "productionSqlExpression"
      FROM chart_data 
      LIMIT 3
    `).all();
    
    for (const row of rows) {
      console.log(`\nRow: ${row.id} - ${row.chartName} - ${row.variableName}`);
      console.log(`- Test SQL: ${row.sqlExpression || 'NULL'}`);
      console.log(`- Production SQL: ${row.productionSqlExpression || 'NULL'}`);
      
      // Check if this row has a test value
      const testValue = db.prepare('SELECT test_value FROM test_data_mapping WHERE id = ?').get(row.id);
      console.log(`- Test Value: ${testValue ? testValue.test_value : 'Not found'}`);
    }
    
    // 5. Summary
    console.log('\n=== SUMMARY ===');
    
    if (emptySqlExprCount > 0 || emptyProdSqlExprCount > 0) {
      console.log('❌ There are still rows with empty SQL expressions that need to be fixed');
    } else {
      console.log('✅ All rows have SQL expressions populated');
    }
    
    if (testCount < totalRows) {
      console.log('❌ Not all rows have test data mappings');
    } else {
      console.log('✅ All rows have test data mappings');
    }
    
    console.log('\nVerification complete');
    
    db.close();
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

main();
