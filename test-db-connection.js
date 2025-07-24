// Test database connection and chart_data table
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

console.log('Testing database connection...');
console.log('Database path:', DB_PATH);

try {
  const db = new Database(DB_PATH);
  console.log('✅ Database connection successful');
  
  // Check if chart_data table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chart_data'").all();
  console.log('Chart_data table exists:', tables.length > 0);
  
  if (tables.length > 0) {
    // Check table structure
    const schema = db.prepare("PRAGMA table_info(chart_data)").all();
    console.log('Table schema:');
    schema.forEach(col => console.log(`  ${col.name}: ${col.type}`));
    
    // Check row count
    const count = db.prepare("SELECT COUNT(*) as count FROM chart_data").get();
    console.log('Total rows in chart_data:', count.count);
    
    // Get first few rows
    if (count.count > 0) {
      const sample = db.prepare("SELECT * FROM chart_data LIMIT 5").all();
      console.log('Sample data:');
      sample.forEach((row, i) => {
        console.log(`  Row ${i + 1}:`, {
          id: row.id,
          chartGroup: row.chartGroup,
          variableName: row.variableName,
          value: row.value
        });
      });
    } else {
      console.log('⚠️  No data found in chart_data table');
    }
  } else {
    console.log('❌ chart_data table does not exist');
  }
  
  db.close();
  console.log('Database connection closed');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
  console.error('Stack:', error.stack);
}
