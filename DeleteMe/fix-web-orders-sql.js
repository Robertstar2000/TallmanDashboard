// Script to fix SQL expressions in Web Orders revenue rows
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Open the database
const db = new Database(path.join(__dirname, '..', 'db.sqlite'));

// Read the initial-data.ts file
const initialDataPath = path.join(__dirname, '..', 'lib', 'db', 'initial-data.ts');
let initialData = fs.readFileSync(initialDataPath, 'utf8');

// Fix the SQL expressions for Web Orders revenue rows
initialData = initialData.replace(
  /strftime\('%Y-%m', date\) = strftime\('%Y-%m', 'now', '-(\d+) month'\)/g,
  "strftime('%Y-%m', date) = strftime('%Y-%m', datetime('now', '-$1 month'))"
);

// Write the fixed data back to the file
fs.writeFileSync(initialDataPath, initialData, 'utf8');

console.log('Fixed SQL expressions in Web Orders revenue rows');

// Query the database to check Web Orders data
try {
  const webOrdersRows = db.prepare("SELECT * FROM chart_data WHERE chartName = 'Web Orders'").all();
  console.log(`Found ${webOrdersRows.length} Web Orders rows in the database`);
  
  // Count how many are Orders Count vs Revenue
  const ordersCount = webOrdersRows.filter(row => row.variableName === 'Orders Count').length;
  const revenue = webOrdersRows.filter(row => row.variableName === 'Revenue').length;
  
  console.log(`Orders Count rows: ${ordersCount}`);
  console.log(`Revenue rows: ${revenue}`);
  
  // Check if we have 12 months of each
  if (ordersCount === 12 && revenue === 12) {
    console.log('Web Orders data looks good: 12 months of Orders Count and 12 months of Revenue');
  } else {
    console.log('Web Orders data is incomplete. Should have 12 months of each variable.');
  }
} catch (err) {
  console.error('Error querying database:', err);
}

// Close the database
db.close();
