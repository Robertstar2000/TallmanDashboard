// Script to check POR Overview data
const Database = require('better-sqlite3');
const path = require('path');

try {
  // Connect to the database
  const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
  console.log(`Opening database at: ${dbPath}`);
  const db = new Database(dbPath);

  // Query for POR Overview rows
  console.log('\n--- POR Overview Rows ---');
  const porRows = db.prepare(`
    SELECT id, chart_name as chartName, variable_name as variableName, value, server_name as serverName
    FROM chart_data 
    WHERE chart_name LIKE '%POR Overview%' OR chart_name LIKE '%por overview%'
  `).all();
  
  console.log(`Found ${porRows.length} POR Overview rows`);
  porRows.forEach(row => console.log(row));

  // Close the database
  db.close();
} catch (error) {
  console.error('Error:', error);
}
