// Comprehensive fix for SQL expressions and test data
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Fixing database at: ${dbPath}`);

try {
  // Open the database
  const db = sqlite3(dbPath);
  
  // Begin transaction for all operations
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // 1. Check database schema
    console.log('\n=== CHECKING DATABASE SCHEMA ===');
    const columns = db.prepare("PRAGMA table_info(chart_data)").all();
    const hasProdSql = columns.some(col => col.name === 'production_sql');
    const hasProdSqlExpr = columns.some(col => col.name === 'production_sql_expression');
    
    console.log(`Production SQL column exists: ${hasProdSql ? 'YES' : 'NO'}`);
    console.log(`Production SQL Expression column exists: ${hasProdSqlExpr ? 'YES' : 'NO'}`);
    
    // 2. Ensure both columns exist and copy data if needed
    if (!hasProdSqlExpr) {
      console.log('\n=== ADDING PRODUCTION_SQL_EXPRESSION COLUMN ===');
      db.prepare('ALTER TABLE chart_data ADD COLUMN production_sql_expression TEXT').run();
      console.log('Added production_sql_expression column');
    }
    
    // 3. Copy data from production_sql to production_sql_expression for all rows
    console.log('\n=== COPYING DATA FROM PRODUCTION_SQL TO PRODUCTION_SQL_EXPRESSION ===');
    if (hasProdSql) {
      const result = db.prepare(`
        UPDATE chart_data 
        SET production_sql_expression = production_sql 
        WHERE production_sql IS NOT NULL
      `).run();
      
      console.log(`Copied data for ${result.changes} rows`);
    }
    
    // 4. Verify data was copied correctly
    const emptyProdSqlExprCount = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE production_sql_expression IS NULL OR production_sql_expression = ''
    `).get().count;
    
    console.log(`Rows with empty production_sql_expression after copy: ${emptyProdSqlExprCount}`);
    
    if (emptyProdSqlExprCount > 0) {
      console.log('\n=== FIXING ROWS WITH EMPTY PRODUCTION_SQL_EXPRESSION ===');
      
      // Get rows with empty production_sql_expression
      const emptyRows = db.prepare(`
        SELECT id, chart_name, variable_name, sql_expression 
        FROM chart_data 
        WHERE (production_sql_expression IS NULL OR production_sql_expression = '')
      `).all();
      
      console.log(`Found ${emptyRows.length} rows with empty production_sql_expression`);
      
      // For each empty row, generate a production SQL expression from the test SQL expression
      const updateStmt = db.prepare(`
        UPDATE chart_data 
        SET production_sql_expression = ? 
        WHERE id = ?
      `);
      
      let fixedCount = 0;
      for (const row of emptyRows) {
        if (row.sql_expression) {
          // Convert test SQL to production SQL format
          let prodSql = row.sql_expression
            .replace(/date\('now'\)/g, 'GETDATE()')
            .replace(/date\(date\)/g, 'CONVERT(date, date)')
            .replace(/strftime\('%m', date\)/g, 'MONTH(date)')
            .replace(/strftime\('%Y', date\)/g, 'YEAR(date)')
            .replace(/COALESCE/g, 'ISNULL')
            .replace(/datetime\('now'\)/g, 'GETDATE()')
            .replace(/datetime\('now', '-(\d+) day'\)/g, 'DATEADD(day, -$1, GETDATE())');
          
          // Add server-specific table references
          if (row.server_name === 'P21') {
            prodSql = prodSql.replace(/FROM ([a-zA-Z0-9_]+)/g, 'FROM P21.dbo.$1 WITH (NOLOCK)');
          } else if (row.server_name === 'POR') {
            prodSql = prodSql.replace(/FROM ([a-zA-Z0-9_]+)/g, 'FROM POR.dbo.$1 WITH (NOLOCK)');
          }
          
          updateStmt.run(prodSql, row.id);
          fixedCount++;
          
          console.log(`Fixed row ${row.id}: ${row.chart_name} - ${row.variable_name}`);
        }
      }
      
      console.log(`Fixed ${fixedCount} rows with empty production_sql_expression`);
    }
    
    // 5. Create and populate test_data_mapping table
    console.log('\n=== SETTING UP TEST DATA MAPPING ===');
    
    // Create test_data_mapping table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT NOT NULL
      )
    `).run();
    
    // Clear existing test data
    db.prepare('DELETE FROM test_data_mapping').run();
    console.log('Cleared existing test data');
    
    // Get all rows from chart_data
    const rows = db.prepare('SELECT id, chart_name, variable_name FROM chart_data').all();
    console.log(`Found ${rows.length} rows to create test data for`);
    
    // Prepare statement for inserting test data
    const insertStmt = db.prepare(`
      INSERT INTO test_data_mapping (id, test_value) 
      VALUES (?, ?)
    `);
    
    // Insert test data for each row
    let insertCount = 0;
    for (const row of rows) {
      // Generate a test value based on the row ID
      // Using a deterministic method to ensure consistent values
      const seed = parseInt(row.id.replace(/\D/g, '') || '1');
      const testValue = (seed * 37) % 900 + 100; // Range 100-999
      
      insertStmt.run(row.id, testValue.toString());
      insertCount++;
    }
    
    console.log(`Created test data for ${insertCount} rows`);
    
    // 6. Verify test data was created
    const testCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
    console.log(`Test data mapping table now has ${testCount} entries`);
    
    // 7. Commit all changes
    db.prepare('COMMIT').run();
    console.log('\n=== CHANGES COMMITTED SUCCESSFULLY ===');
    
  } catch (error) {
    // Rollback on error
    db.prepare('ROLLBACK').run();
    console.error('Error during database fix, changes rolled back:', error);
  }
  
  // Close the database
  db.close();
  console.log('\nDatabase fix completed');
} catch (error) {
  console.error('Error opening database:', error);
}
