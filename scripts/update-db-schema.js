const sqlite3 = require('better-sqlite3');
const path = require('path');

// Open the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
const db = sqlite3(dbPath);

// Check if production_sql_expression column exists
const columns = db.prepare("PRAGMA table_info(chart_data)").all();
const hasProductionSqlExpression = columns.some(col => col.name === 'production_sql_expression');

if (!hasProductionSqlExpression) {
  console.log('Adding production_sql_expression column to chart_data table...');
  
  // Start a transaction
  const transaction = db.transaction(() => {
    // Add the new column
    db.prepare("ALTER TABLE chart_data ADD COLUMN production_sql_expression TEXT").run();
    
    // Copy data from production_sql to production_sql_expression
    db.prepare("UPDATE chart_data SET production_sql_expression = production_sql").run();
    
    console.log('Column added and data copied successfully.');
  });
  
  // Execute the transaction
  transaction();
} else {
  console.log('production_sql_expression column already exists.');
}

// Close the database
db.close();
