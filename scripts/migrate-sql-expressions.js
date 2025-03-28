// Script to migrate data from production_sql to production_sql_expression
// and ensure all rows have valid SQL expressions
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Migrating SQL expressions in database at: ${dbPath}`);

async function migrateData() {
  try {
    // Open the database
    const db = sqlite3(dbPath);
    
    // Check if both columns exist
    const columns = db.prepare("PRAGMA table_info(chart_data)").all();
    const hasProductionSql = columns.some(col => col.name === 'production_sql');
    const hasProductionSqlExpr = columns.some(col => col.name === 'production_sql_expression');
    
    console.log(`Column check: production_sql exists: ${hasProductionSql}, production_sql_expression exists: ${hasProductionSqlExpr}`);
    
    if (!hasProductionSqlExpr) {
      console.error('Error: production_sql_expression column does not exist. Please run database initialization first.');
      process.exit(1);
    }
    
    // Get all rows
    const rows = db.prepare(`
      SELECT 
        id, 
        sql_expression, 
        production_sql_expression,
        production_sql
      FROM chart_data
    `).all();
    
    console.log(`Found ${rows.length} rows in the chart_data table`);
    
    // Count rows with missing expressions
    const missingTestSql = rows.filter(row => !row.sql_expression).length;
    const missingProdSqlExpr = rows.filter(row => !row.production_sql_expression).length;
    
    console.log(`Rows with missing test SQL: ${missingTestSql}`);
    console.log(`Rows with missing production SQL expression: ${missingProdSqlExpr}`);
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    let updatedCount = 0;
    
    // Update each row
    for (const row of rows) {
      // If production_sql_expression is empty but production_sql exists, copy it
      if ((!row.production_sql_expression || row.production_sql_expression.trim() === '') && 
          row.production_sql && row.production_sql.trim() !== '') {
        
        db.prepare(`
          UPDATE chart_data 
          SET production_sql_expression = ? 
          WHERE id = ?
        `).run(row.production_sql, row.id);
        
        updatedCount++;
      }
      
      // If production_sql_expression is still empty, copy from sql_expression
      if (!row.production_sql_expression || row.production_sql_expression.trim() === '') {
        if (row.sql_expression && row.sql_expression.trim() !== '') {
          db.prepare(`
            UPDATE chart_data 
            SET production_sql_expression = ? 
            WHERE id = ?
          `).run(row.sql_expression, row.id);
          
          updatedCount++;
        }
      }
      
      // If sql_expression is empty, generate a simple test expression
      if (!row.sql_expression || row.sql_expression.trim() === '') {
        const testSql = `SELECT ${Math.floor(Math.random() * 900) + 100} -- Test value for row ${row.id}`;
        
        db.prepare(`
          UPDATE chart_data 
          SET sql_expression = ? 
          WHERE id = ?
        `).run(testSql, row.id);
        
        updatedCount++;
      }
    }
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    console.log(`Updated ${updatedCount} SQL expressions`);
    
    // Verify the migration
    const verifyRows = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(CASE WHEN sql_expression IS NULL OR sql_expression = '' THEN 1 ELSE 0 END) as missing_test_sql,
        SUM(CASE WHEN production_sql_expression IS NULL OR production_sql_expression = '' THEN 1 ELSE 0 END) as missing_prod_sql
      FROM chart_data
    `).get();
    
    console.log('\nVerification results:');
    console.log(`Total rows: ${verifyRows.count}`);
    console.log(`Rows with missing test SQL: ${verifyRows.missing_test_sql}`);
    console.log(`Rows with missing production SQL: ${verifyRows.missing_prod_sql}`);
    
    if (verifyRows.missing_test_sql === 0 && verifyRows.missing_prod_sql === 0) {
      console.log('\n✅ Migration successful! All rows now have valid SQL expressions.');
    } else {
      console.log('\n⚠️ Migration completed but some rows still have missing SQL expressions.');
    }
    
    db.close();
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

migrateData();
