// Script to check Web Orders data in the database
const Database = require('better-sqlite3');
const path = require('path');

try {
  // Connect to the database
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);

  // Query for Open Orders rows (which are used for Web Orders)
  console.log('\n--- Open Orders Rows (used for Web Orders) ---');
  const openOrdersRows = db.prepare(`
    SELECT id, chart_name as chartName, variable_name as variableName, value, server_name as serverName
    FROM chart_data 
    WHERE chart_name = 'Open Orders'
  `).all();
  
  console.log(`Found ${openOrdersRows.length} Open Orders rows`);
  openOrdersRows.forEach(row => console.log(row));

  // Close the database
  db.close();
} catch (error) {
  console.error('Error:', error);
}
