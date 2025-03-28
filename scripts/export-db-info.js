// Script to export database information to a file for better readability
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
const outputPath = path.join(process.cwd(), 'db-info.txt');

// Open a write stream for the output file
const outputStream = fs.createWriteStream(outputPath);

function write(text) {
  outputStream.write(text + '\n');
  console.log(text);
}

try {
  write(`Checking database at: ${dbPath}`);
  
  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    write(`Database file not found at: ${dbPath}`);
    process.exit(1);
  }

  // Open the database
  const db = sqlite3(dbPath);
  
  // 1. Check database schema
  write('\n=== DATABASE SCHEMA ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  write(`Found ${tables.length} tables:`);
  tables.forEach(table => {
    write(`- ${table.name}`);
  });
  
  // 2. Check chart_data table structure
  write('\n=== CHART_DATA TABLE STRUCTURE ===');
  const columns = db.prepare("PRAGMA table_info(chart_data)").all();
  columns.forEach(col => {
    write(`- ${col.name} (${col.type})`);
  });
  
  // 3. Check for SQL expression columns
  const hasSqlExpr = columns.some(col => col.name === 'sql_expression');
  const hasProdSqlExpr = columns.some(col => col.name === 'production_sql_expression');
  const hasProdSql = columns.some(col => col.name === 'production_sql');
  
  write(`\nSQL Expression columns:`);
  write(`- sql_expression: ${hasSqlExpr ? 'Present' : 'Missing'}`);
  write(`- production_sql_expression: ${hasProdSqlExpr ? 'Present' : 'Missing'}`);
  write(`- production_sql: ${hasProdSql ? 'Present' : 'Missing'}`);
  
  // 4. Check for empty SQL expressions
  write('\n=== SQL EXPRESSION CONTENT CHECK ===');
  
  // Check for rows with empty sql_expression
  if (hasSqlExpr) {
    const emptySqlExprCount = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE sql_expression IS NULL OR sql_expression = ''
    `).get().count;
    write(`Rows with empty sql_expression: ${emptySqlExprCount}`);
  }
  
  // Check for rows with empty production_sql_expression
  if (hasProdSqlExpr) {
    const emptyProdSqlExprCount = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE production_sql_expression IS NULL OR production_sql_expression = ''
    `).get().count;
    write(`Rows with empty production_sql_expression: ${emptyProdSqlExprCount}`);
  }
  
  // Check for rows with empty production_sql
  if (hasProdSql) {
    const emptyProdSqlCount = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE production_sql IS NULL OR production_sql = ''
    `).get().count;
    write(`Rows with empty production_sql: ${emptyProdSqlCount}`);
  }
  
  // 5. Sample rows with SQL expressions
  write('\n=== SAMPLE ROWS WITH SQL EXPRESSIONS ===');
  let query = 'SELECT id, chart_name, variable_name';
  
  if (hasSqlExpr) query += ', sql_expression';
  if (hasProdSqlExpr) query += ', production_sql_expression';
  if (hasProdSql) query += ', production_sql';
  
  query += ' FROM chart_data LIMIT 3';
  
  const sampleRows = db.prepare(query).all();
  sampleRows.forEach((row, index) => {
    write(`\nRow ${index + 1}: ${row.id} - ${row.chart_name} - ${row.variable_name}`);
    
    if (hasSqlExpr) {
      write(`- sql_expression: ${row.sql_expression || 'NULL'}`);
    }
    
    if (hasProdSqlExpr) {
      write(`- production_sql_expression: ${row.production_sql_expression || 'NULL'}`);
    }
    
    if (hasProdSql) {
      write(`- production_sql: ${row.production_sql || 'NULL'}`);
    }
  });
  
  // 6. Check test_data_mapping table
  write('\n=== TEST DATA MAPPING ===');
  const testTableExists = tables.some(t => t.name === 'test_data_mapping');
  
  if (testTableExists) {
    const testCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
    write(`Test data mapping table exists with ${testCount} entries`);
    
    if (testCount > 0) {
      const testSamples = db.prepare('SELECT id, test_value FROM test_data_mapping LIMIT 5').all();
      write('\nSample test data mappings:');
      testSamples.forEach(row => {
        write(`- ${row.id}: ${row.test_value}`);
      });
    } else {
      write('Test data mapping table is empty');
    }
  } else {
    write('Test data mapping table does not exist');
  }
  
  // 7. Check for data in chart_data table
  const totalRows = db.prepare('SELECT COUNT(*) as count FROM chart_data').get().count;
  write(`\nTotal rows in chart_data table: ${totalRows}`);
  
  // 8. Check if we need to create a migration to copy data
  if (hasProdSql && hasProdSqlExpr) {
    write('\n=== MIGRATION CHECK ===');
    const needsMigration = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE (production_sql_expression IS NULL OR production_sql_expression = '') 
      AND production_sql IS NOT NULL AND production_sql != ''
    `).get().count;
    
    if (needsMigration > 0) {
      write(`${needsMigration} rows need migration from production_sql to production_sql_expression`);
    } else {
      write('No migration needed, all rows have proper data');
    }
  }
  
  // Close the database
  db.close();
  outputStream.end();
  write(`\nDetailed database check completed. Results written to ${outputPath}`);
} catch (error) {
  write(`Error during database check: ${error}`);
  outputStream.end();
}
