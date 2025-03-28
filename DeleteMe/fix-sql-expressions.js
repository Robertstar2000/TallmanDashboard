// Script to fix SQL expressions in the database
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Checking database at: ${dbPath}`);

try {
  // Open the database
  const db = sqlite3(dbPath);
  
  // Check if both columns exist
  const columns = db.prepare("PRAGMA table_info(chart_data)").all();
  const hasProdSql = columns.some(col => col.name === 'production_sql');
  const hasProdSqlExpr = columns.some(col => col.name === 'production_sql_expression');
  
  console.log(`Production SQL column exists: ${hasProdSql ? 'YES' : 'NO'}`);
  console.log(`Production SQL Expression column exists: ${hasProdSqlExpr ? 'YES' : 'NO'}`);
  
  // If both columns exist, check if we need to migrate data
  if (hasProdSql && hasProdSqlExpr) {
    // Check for rows where production_sql_expression is empty but production_sql has data
    const needsMigration = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE (production_sql_expression IS NULL OR production_sql_expression = '') 
      AND production_sql IS NOT NULL AND production_sql != ''
    `).get().count;
    
    console.log(`Rows needing migration: ${needsMigration}`);
    
    if (needsMigration > 0) {
      console.log('Migrating data from production_sql to production_sql_expression...');
      
      // Begin transaction
      db.prepare('BEGIN TRANSACTION').run();
      
      try {
        // Update rows where production_sql_expression is empty but production_sql has data
        const result = db.prepare(`
          UPDATE chart_data 
          SET production_sql_expression = production_sql 
          WHERE (production_sql_expression IS NULL OR production_sql_expression = '') 
          AND production_sql IS NOT NULL AND production_sql != ''
        `).run();
        
        console.log(`Updated ${result.changes} rows`);
        
        // Commit transaction
        db.prepare('COMMIT').run();
      } catch (error) {
        // Rollback transaction on error
        db.prepare('ROLLBACK').run();
        console.error('Error during migration:', error);
      }
    } else {
      console.log('No migration needed');
    }
  } else if (hasProdSql && !hasProdSqlExpr) {
    // If only production_sql exists, add production_sql_expression column
    console.log('Adding production_sql_expression column...');
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Add production_sql_expression column
      db.prepare('ALTER TABLE chart_data ADD COLUMN production_sql_expression TEXT').run();
      
      // Copy data from production_sql to production_sql_expression
      const result = db.prepare(`
        UPDATE chart_data 
        SET production_sql_expression = production_sql 
        WHERE production_sql IS NOT NULL AND production_sql != ''
      `).run();
      
      console.log(`Added column and copied data to ${result.changes} rows`);
      
      // Commit transaction
      db.prepare('COMMIT').run();
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      console.error('Error adding column:', error);
    }
  }
  
  // Check for empty SQL expressions after migration
  const emptySqlExprCount = db.prepare(`
    SELECT COUNT(*) as count FROM chart_data 
    WHERE sql_expression IS NULL OR sql_expression = ''
  `).get().count;
  
  const emptyProdSqlExprCount = hasProdSqlExpr ? db.prepare(`
    SELECT COUNT(*) as count FROM chart_data 
    WHERE production_sql_expression IS NULL OR production_sql_expression = ''
  `).get().count : 'N/A';
  
  console.log(`\nRows with empty sql_expression: ${emptySqlExprCount}`);
  console.log(`Rows with empty production_sql_expression: ${emptyProdSqlExprCount}`);
  
  // Check test_data_mapping table
  const testTableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'
  `).get();
  
  if (!testTableExists) {
    console.log('\nCreating test_data_mapping table...');
    
    // Create test_data_mapping table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS test_data_mapping (
        id TEXT PRIMARY KEY,
        test_value TEXT NOT NULL
      )
    `).run();
    
    console.log('Test data mapping table created');
  } else {
    const testCount = db.prepare('SELECT COUNT(*) as count FROM test_data_mapping').get().count;
    console.log(`\nTest data mapping table exists with ${testCount} entries`);
  }
  
  // Initialize test data for all rows
  console.log('\nInitializing test data for all rows...');
  
  // Get all row IDs
  const rows = db.prepare('SELECT id FROM chart_data').all();
  
  // Begin transaction
  db.prepare('BEGIN TRANSACTION').run();
  
  try {
    // Prepare statement for inserting/updating test data
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO test_data_mapping (id, test_value) 
      VALUES (?, ?)
    `);
    
    // Insert test data for each row
    let count = 0;
    for (const row of rows) {
      // Generate a test value (random between 100 and 1000)
      const testValue = Math.floor(Math.random() * 900) + 100;
      
      // Insert or update test data
      insertStmt.run(row.id, testValue.toString());
      count++;
    }
    
    console.log(`Initialized test data for ${count} rows`);
    
    // Commit transaction
    db.prepare('COMMIT').run();
  } catch (error) {
    // Rollback transaction on error
    db.prepare('ROLLBACK').run();
    console.error('Error initializing test data:', error);
  }
  
  // Close the database
  db.close();
  console.log('\nDatabase update completed');
} catch (error) {
  console.error('Error updating database:', error);
}
