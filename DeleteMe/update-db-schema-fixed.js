// Script to update database schema
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(process.cwd(), 'tallman.db');
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

// Check if chart_group column exists
const columns = db.prepare('PRAGMA table_info(chart_data)').all();
const hasChartGroup = columns.some(col => col.name === 'chart_group');

if (!hasChartGroup) {
  console.log('Adding chart_group column to chart_data table...');
  
  try {
    // Add chart_group column
    db.prepare('ALTER TABLE chart_data ADD COLUMN chart_group TEXT').run();
    
    // Set chart_group to match chart_name for existing rows
    db.prepare('UPDATE chart_data SET chart_group = chart_name WHERE chart_group IS NULL').run();
    
    console.log('Successfully added chart_group column');
  } catch (error) {
    console.error('Error adding chart_group column:', error);
  }
} else {
  console.log('chart_group column already exists');
}

// Check if production_sql_expression column exists
const hasProductionSql = columns.some(col => col.name === 'production_sql_expression');

if (!hasProductionSql) {
  console.log('Adding production_sql_expression column to chart_data table...');
  
  try {
    // Add production_sql_expression column
    db.prepare('ALTER TABLE chart_data ADD COLUMN production_sql_expression TEXT').run();
    
    // Set production_sql_expression to match sql_expression for existing rows
    db.prepare('UPDATE chart_data SET production_sql_expression = sql_expression WHERE production_sql_expression IS NULL').run();
    
    console.log('Successfully added production_sql_expression column');
  } catch (error) {
    console.error('Error adding production_sql_expression column:', error);
  }
} else {
  console.log('production_sql_expression column already exists');
}

// Check if db_table_name column exists
const hasDbTableName = columns.some(col => col.name === 'db_table_name');

if (!hasDbTableName) {
  console.log('Adding db_table_name column to chart_data table...');
  
  try {
    // Add db_table_name column
    db.prepare('ALTER TABLE chart_data ADD COLUMN db_table_name TEXT').run();
    
    // Set db_table_name to match table_name for existing rows
    db.prepare('UPDATE chart_data SET db_table_name = table_name WHERE db_table_name IS NULL').run();
    
    console.log('Successfully added db_table_name column');
  } catch (error) {
    console.error('Error adding db_table_name column:', error);
  }
} else {
  console.log('db_table_name column already exists');
}

// Check if last_updated column exists
const hasLastUpdated = columns.some(col => col.name === 'last_updated');

if (!hasLastUpdated) {
  console.log('Adding last_updated column to chart_data table...');
  
  try {
    // Add last_updated column
    db.prepare('ALTER TABLE chart_data ADD COLUMN last_updated TEXT').run();
    
    // Set last_updated to current timestamp for existing rows
    db.prepare("UPDATE chart_data SET last_updated = datetime('now') WHERE last_updated IS NULL").run();
    
    console.log('Successfully added last_updated column');
  } catch (error) {
    console.error('Error adding last_updated column:', error);
  }
} else {
  console.log('last_updated column already exists');
}

// Display updated schema
const updatedColumns = db.prepare('PRAGMA table_info(chart_data)').all();
console.log('\nUpdated Chart Data Columns:');
updatedColumns.forEach(col => {
  console.log(`- ${col.name} (${col.type})`);
});

// Close the database connection
db.close();
