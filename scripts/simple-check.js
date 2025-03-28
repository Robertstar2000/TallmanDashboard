// Simple check script with cleaner output
const sqlite3 = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');

function check() {
  try {
    console.log('Checking database...');
    const db = sqlite3(dbPath);
    
    // Check SQL expressions
    const emptySqlExpr = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE sql_expression IS NULL OR sql_expression = ''
    `).get().count;
    
    const emptyProdSqlExpr = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data 
      WHERE production_sql_expression IS NULL OR production_sql_expression = ''
    `).get().count;
    
    console.log(`Empty SQL expressions: ${emptySqlExpr}`);
    console.log(`Empty Production SQL expressions: ${emptyProdSqlExpr}`);
    
    // Check test data
    const testCount = db.prepare(`
      SELECT COUNT(*) as count FROM test_data_mapping
    `).get().count;
    
    const totalRows = db.prepare(`
      SELECT COUNT(*) as count FROM chart_data
    `).get().count;
    
    console.log(`Test data mappings: ${testCount}/${totalRows}`);
    
    // Sample data
    const sample = db.prepare(`
      SELECT cd.id, cd.chart_name, cd.variable_name, td.test_value 
      FROM chart_data cd
      LEFT JOIN test_data_mapping td ON cd.id = td.id
      LIMIT 3
    `).all();
    
    console.log('\nSample data:');
    sample.forEach(row => {
      console.log(`- Row ${row.id}: ${row.chart_name} - ${row.variable_name}, Test value: ${row.test_value || 'MISSING'}`);
    });
    
    db.close();
    console.log('\nCheck complete');
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
