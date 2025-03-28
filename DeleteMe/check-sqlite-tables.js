const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function checkSqliteTables() {
  try {
    // Connect to the SQLite database
    const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
    console.log(`Database path: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Get all tables
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('Tables in database:', tables.map(t => t.name));
    
    // Check if chart_data table exists
    if (tables.some(t => t.name === 'chart_data')) {
      // Get column info for chart_data
      const columns = await db.all("PRAGMA table_info(chart_data)");
      console.log('\nColumns in chart_data table:');
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
      
      // Count rows in chart_data
      const rowCount = await db.get("SELECT COUNT(*) as count FROM chart_data");
      console.log(`\nTotal rows in chart_data: ${rowCount.count}`);
      
      // Get sample data
      const sampleData = await db.all("SELECT * FROM chart_data LIMIT 5");
      console.log('\nSample data from chart_data:');
      sampleData.forEach(row => {
        console.log(JSON.stringify(row));
      });
      
      // Check AR Aging data specifically
      const arAgingData = await db.all("SELECT * FROM chart_data WHERE chart_group = 'AR Aging'");
      console.log(`\nAR Aging data (${arAgingData.length} rows):`);
      arAgingData.forEach(row => {
        console.log(JSON.stringify(row));
      });
    }
    
    await db.close();
  } catch (error) {
    console.error('Error checking SQLite tables:', error);
  }
}

checkSqliteTables()
  .then(() => console.log('Done checking SQLite tables'))
  .catch(err => console.error('Error:', err));
