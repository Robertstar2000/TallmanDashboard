// Script to check chart_data table contents
const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(process.cwd(), 'tallman.db');
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

// Get chart groups and count of rows per chart group
try {
  const chartGroups = db.prepare(`
    SELECT chart_group, COUNT(*) as count 
    FROM chart_data 
    GROUP BY chart_group
  `).all();
  
  console.log('\nChart Groups and Row Counts:');
  chartGroups.forEach(group => {
    console.log(`- ${group.chart_group || 'NULL'}: ${group.count} rows`);
  });
  
  // Get total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM chart_data').get();
  console.log(`\nTotal rows in chart_data: ${totalCount.count}`);
  
  // Sample some rows to see the structure
  console.log('\nSample Rows:');
  const sampleRows = db.prepare('SELECT * FROM chart_data LIMIT 5').all();
  sampleRows.forEach(row => {
    console.log(JSON.stringify(row, null, 2));
  });
  
} catch (error) {
  console.error('Error querying chart_data:', error);
}

// Close the database connection
db.close();
