// Script to check SQL expressions in the database
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Checking database at: ${dbPath}`);

try {
  // Open the database
  const db = sqlite3(dbPath);
  
  // Check table schema
  console.log('\n=== CHART_DATA TABLE SCHEMA ===');
  const schema = db.prepare('PRAGMA table_info(chart_data)').all();
  schema.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  // Check if both production_sql and production_sql_expression exist
  const hasProdSql = schema.some(col => col.name === 'production_sql');
  const hasProdSqlExpr = schema.some(col => col.name === 'production_sql_expression');
  
  console.log(`\nHas production_sql column: ${hasProdSql ? 'YES' : 'NO'}`);
  console.log(`Has production_sql_expression column: ${hasProdSqlExpr ? 'YES' : 'NO'}`);
  
  // Get sample rows to check both columns
  console.log('\n=== SAMPLE ROWS WITH BOTH COLUMNS ===');
  let query = '';
  
  if (hasProdSql && hasProdSqlExpr) {
    query = `
      SELECT id, chart_name, variable_name, 
             production_sql, production_sql_expression
      FROM chart_data
      LIMIT 5
    `;
  } else if (hasProdSqlExpr) {
    query = `
      SELECT id, chart_name, variable_name, 
             production_sql_expression
      FROM chart_data
      LIMIT 5
    `;
  } else if (hasProdSql) {
    query = `
      SELECT id, chart_name, variable_name, 
             production_sql
      FROM chart_data
      LIMIT 5
    `;
  } else {
    console.log('Neither production_sql nor production_sql_expression columns exist');
    process.exit(1);
  }
  
  const rows = db.prepare(query).all();
  
  rows.forEach((row, index) => {
    console.log(`\nRow ${index + 1}: ${row.id} - ${row.chart_name} - ${row.variable_name}`);
    
    if (hasProdSql) {
      const prodSql = row.production_sql || 'NULL';
      console.log(`- production_sql: ${prodSql.length > 50 ? prodSql.substring(0, 50) + '...' : prodSql}`);
    }
    
    if (hasProdSqlExpr) {
      const prodSqlExpr = row.production_sql_expression || 'NULL';
      console.log(`- production_sql_expression: ${prodSqlExpr.length > 50 ? prodSqlExpr.substring(0, 50) + '...' : prodSqlExpr}`);
    }
  });
  
  // Check for empty values
  console.log('\n=== CHECKING FOR EMPTY VALUES ===');
  
  if (hasProdSqlExpr) {
    const emptyExprCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM chart_data 
      WHERE production_sql_expression IS NULL OR production_sql_expression = ''
    `).get().count;
    
    console.log(`Rows with empty production_sql_expression: ${emptyExprCount}`);
    
    if (emptyExprCount > 0) {
      console.log('\nSample rows with empty production_sql_expression:');
      const emptyExprRows = db.prepare(`
        SELECT id, chart_name, variable_name 
        FROM chart_data 
        WHERE production_sql_expression IS NULL OR production_sql_expression = ''
        LIMIT 5
      `).all();
      
      emptyExprRows.forEach(row => {
        console.log(`- ${row.id}: ${row.chart_name} - ${row.variable_name}`);
      });
    }
  }
  
  if (hasProdSql) {
    const emptySqlCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM chart_data 
      WHERE production_sql IS NULL OR production_sql = ''
    `).get().count;
    
    console.log(`Rows with empty production_sql: ${emptySqlCount}`);
    
    if (emptySqlCount > 0) {
      console.log('\nSample rows with empty production_sql:');
      const emptySqlRows = db.prepare(`
        SELECT id, chart_name, variable_name 
        FROM chart_data 
        WHERE production_sql IS NULL OR production_sql = ''
        LIMIT 5
      `).all();
      
      emptySqlRows.forEach(row => {
        console.log(`- ${row.id}: ${row.chart_name} - ${row.variable_name}`);
      });
    }
  }
  
  // Check test data mapping
  console.log('\n=== TEST DATA MAPPING ===');
  const testTableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'
  `).get();
  
  if (testTableExists) {
    const testCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
    console.log(`Test data mapping table exists with ${testCount} entries`);
    
    if (testCount > 0) {
      console.log('\nSample test data mappings:');
      const testRows = db.prepare('SELECT id, test_value FROM test_data_mapping LIMIT 5').all();
      testRows.forEach(row => {
        console.log(`- ${row.id}: ${row.test_value}`);
      });
    } else {
      console.log('Test data mapping table is empty');
    }
  } else {
    console.log('Test data mapping table does not exist');
  }
  
  // Close the database
  db.close();
  console.log('\nCheck completed');
} catch (error) {
  console.error('Error checking SQL expressions:', error);
}
