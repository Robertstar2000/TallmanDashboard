// Script to preview chart data
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
  
  console.log('\n=== CHART DATA PREVIEW ===\n');
  console.log('Chart Groups and Row Counts:');
  chartGroups.forEach(group => {
    console.log(`- ${group.chart_group}: ${group.count} rows`);
  });
  
  // Get total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM chart_data').get();
  console.log(`\nTotal rows in chart_data: ${totalCount.count}`);
  
  // Show sample data for each chart group
  console.log('\n=== SAMPLE DATA FOR EACH CHART GROUP ===\n');
  
  for (const group of chartGroups) {
    console.log(`\n== ${group.chart_group} ==`);
    
    // Get variables for this chart group
    const variables = db.prepare(`
      SELECT DISTINCT variable_name 
      FROM chart_data 
      WHERE chart_group = ?
    `).all(group.chart_group);
    
    console.log(`Variables: ${variables.map(v => v.variable_name).join(', ')}`);
    
    // Get sample rows for this chart group
    const sampleRows = db.prepare(`
      SELECT id, chart_name, variable_name, value, last_updated
      FROM chart_data 
      WHERE chart_group = ?
      LIMIT 5
    `).all(group.chart_group);
    
    console.log('\nSample Rows:');
    sampleRows.forEach(row => {
      console.log(`  ID: ${row.id}, Chart: ${row.chart_name}, Variable: ${row.variable_name}, Value: ${row.value}`);
    });
    
    // If this chart has multiple months, show the distribution
    const timeframes = db.prepare(`
      SELECT DISTINCT last_updated as timeframe
      FROM chart_data 
      WHERE chart_group = ?
    `).all(group.chart_group);
    
    if (timeframes.length > 1) {
      console.log(`\nThis chart has data across ${timeframes.length} time periods.`);
    }
  }
  
} catch (error) {
  console.error('Error querying chart_data:', error);
}

// Close the database connection
db.close();
