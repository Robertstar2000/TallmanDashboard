// Script to check database data
const Database = require('better-sqlite3');
const path = require('path');

try {
  // Connect to the database
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);

  // Query for Historical Data rows
  console.log('\n--- Historical Data Rows ---');
  const historicalRows = db.prepare(`
    SELECT id, chart_name as chartName, variable_name as variableName, value, server_name as serverName
    FROM chart_data 
    WHERE chart_name LIKE '%Historical%' OR chart_name LIKE '%historical%'
  `).all();
  
  console.log(`Found ${historicalRows.length} Historical Data rows`);
  historicalRows.forEach(row => console.log(row));

  // Query for all chart groups
  console.log('\n--- Chart Groups ---');
  const chartGroups = db.prepare(`
    SELECT DISTINCT chart_name as chartName
    FROM chart_data
  `).all();
  
  console.log(`Found ${chartGroups.length} chart groups`);
  chartGroups.forEach(group => console.log(group));

  // Close the database
  db.close();
} catch (error) {
  console.error('Error:', error);
}
