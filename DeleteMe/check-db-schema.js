const sqlite3 = require('better-sqlite3');
const path = require('path');

// Open the database
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
const db = sqlite3(dbPath);

// Get table schema
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in database:');
tables.forEach(table => {
  console.log(`\n--- Table: ${table.name} ---`);
  const tableInfo = db.prepare(`PRAGMA table_info(${table.name})`).all();
  tableInfo.forEach(column => {
    console.log(`${column.name} (${column.type})`);
  });
});

// Close the database
db.close();
