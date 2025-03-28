// Script to check Open Orders data
const Database = require('better-sqlite3');
const path = require('path');

try {
  // Connect to the database
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);

  // Query for Open Orders rows
  console.log('\n--- Open Orders Rows ---');
  const openOrdersRows = db.prepare(`
    SELECT id, chart_name as chartName, variable_name as variableName, value, server_name as serverName
    FROM chart_data 
    WHERE chart_name LIKE '%Open Orders%' OR chart_name LIKE '%open orders%'
  `).all();
  
  console.log(`Found ${openOrdersRows.length} Open Orders rows`);
  openOrdersRows.forEach(row => console.log(row));

  // Close the database
  db.close();
} catch (error) {
  console.error('Error:', error);
}
