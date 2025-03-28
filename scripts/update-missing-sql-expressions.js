// Script to update any rows missing productionSqlExpression
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Updating database at: ${dbPath}`);

try {
  // Check if database file exists
  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found at: ${dbPath}`);
    process.exit(1);
  }

  // Open the database
  const db = sqlite3(dbPath);
  
  // Begin transaction
  const transaction = db.transaction(() => {
    // 1. Check if production_sql_expression column exists
    const columns = db.prepare("PRAGMA table_info(chart_data)").all();
    const hasProdSqlExpr = columns.some(col => col.name === 'production_sql_expression');
    
    if (!hasProdSqlExpr) {
      console.log("Adding production_sql_expression column to chart_data table...");
      db.prepare("ALTER TABLE chart_data ADD COLUMN production_sql_expression TEXT").run();
      console.log("Column added successfully");
    }
    
    // 2. Find rows where production_sql_expression is null but production_sql exists
    const missingRows = db.prepare(`
      SELECT id, production_sql 
      FROM chart_data 
      WHERE (production_sql_expression IS NULL OR production_sql_expression = '') 
        AND production_sql IS NOT NULL
    `).all();
    
    console.log(`Found ${missingRows.length} rows with missing production_sql_expression`);
    
    // 3. Update those rows to copy data from production_sql to production_sql_expression
    if (missingRows.length > 0) {
      const updateStmt = db.prepare(`
        UPDATE chart_data 
        SET production_sql_expression = production_sql 
        WHERE id = ?
      `);
      
      for (const row of missingRows) {
        updateStmt.run(row.id);
        console.log(`Updated row ${row.id}`);
      }
      
      console.log(`Updated ${missingRows.length} rows`);
    }
    
    // 4. Find rows where both fields are null
    const bothNullRows = db.prepare(`
      SELECT id, chart_name, variable_name 
      FROM chart_data 
      WHERE (production_sql_expression IS NULL OR production_sql_expression = '') 
        AND (production_sql IS NULL OR production_sql = '')
    `).all();
    
    if (bothNullRows.length > 0) {
      console.log(`\nWarning: Found ${bothNullRows.length} rows with both production_sql and production_sql_expression missing:`);
      bothNullRows.forEach(row => {
        console.log(`- Row ${row.id}: ${row.chart_name} - ${row.variable_name}`);
      });
    }
    
    // 5. Verify all rows now have production_sql_expression
    const stillMissingCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM chart_data 
      WHERE production_sql_expression IS NULL OR production_sql_expression = ''
    `).get().count;
    
    console.log(`\nRows still missing production_sql_expression after update: ${stillMissingCount}`);
    
    // 6. Check for test_data_mapping table
    const testTableExists = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='test_data_mapping'
    `).get();
    
    if (!testTableExists) {
      console.log("\nCreating test_data_mapping table...");
      db.prepare(`
        CREATE TABLE IF NOT EXISTS test_data_mapping (
          id TEXT PRIMARY KEY,
          test_value TEXT NOT NULL
        )
      `).run();
      console.log("Test data mapping table created");
    } else {
      const testCount = db.prepare("SELECT COUNT(*) as count FROM test_data_mapping").get().count;
      console.log(`\nTest data mapping table exists with ${testCount} entries`);
    }
  });
  
  // Execute the transaction
  transaction();
  
  console.log("\nDatabase update completed successfully");
  
  // Close the database
  db.close();
} catch (error) {
  console.error("Error updating database:", error);
}
