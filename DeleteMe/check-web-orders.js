// Script to check Web Orders data
const Database = require('better-sqlite3');
const path = require('path');

try {
  // Connect to the database
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);

  // Query for Web Orders rows
  console.log('\n--- Web Orders Rows ---');
  const webOrdersRows = db.prepare(`
    SELECT id, chart_name as chartName, variable_name as variableName, value, server_name as serverName
    FROM chart_data 
    WHERE chart_name LIKE '%Web Orders%' OR chart_name LIKE '%web orders%'
  `).all();
  
  console.log(`Found ${webOrdersRows.length} Web Orders rows`);
  webOrdersRows.forEach(row => console.log(row));

  // Close the database
  db.close();
} catch (error) {
  console.error('Error:', error);
}
