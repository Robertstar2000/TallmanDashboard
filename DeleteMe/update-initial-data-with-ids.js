// Script to update the initial-data.ts file with the new sequential IDs from the database
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = path.join(process.cwd(), 'data', 'dashboard.db');
console.log(`Database path: ${dbPath}`);

// Path to initial-data.ts
const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
console.log(`Initial data path: ${initialDataPath}`);

// Open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Get all rows with their IDs
db.all(`
  SELECT id, chart_group, variable_name 
  FROM chart_data 
  ORDER BY id
`, (err, rows) => {
  if (err) {
    console.error('Error getting rows:', err.message);
    closeDb();
    return;
  }
  
  console.log(`Found ${rows.length} rows in the database`);
  
  // Create a mapping of chart_group + variable_name to ID
  const idMapping = {};
  rows.forEach(row => {
    const key = `${row.chart_group}:${row.variable_name}`;
    idMapping[key] = row.id;
    console.log(`Mapping ${key} -> ${row.id}`);
  });
  
  // Read the initial-data.ts file
  fs.readFile(initialDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading initial-data.ts:', err.message);
      closeDb();
      return;
    }
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.bak';
    fs.writeFileSync(backupPath, data);
    console.log(`Created backup at ${backupPath}`);
    
    // Update the IDs in the initial data
    let updatedData = data;
    let replacementCount = 0;
    
    // Find all occurrences of chart group and variable name in the file
    // This regex looks for patterns like: { id: 'some-id', chartGroup: 'Group Name', variableName: 'Variable Name', ... }
    const regex = /{\s*id:\s*['"]([^'"]*)['"]\s*,\s*chartGroup:\s*['"]([^'"]*)['"]\s*,\s*variableName:\s*['"]([^'"]*)['"]/g;
    
    updatedData = data.replace(regex, (match, id, chartGroup, variableName) => {
      const key = `${chartGroup}:${variableName}`;
      const newId = idMapping[key];
      
      if (newId) {
        replacementCount++;
        console.log(`Replacing ID for ${key}: ${id} -> ${newId}`);
        return match.replace(`id: '${id}'`, `id: '${newId}'`);
      }
      
      return match;
    });
    
    // Write the updated file
    fs.writeFile(initialDataPath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing updated initial-data.ts:', err.message);
        closeDb();
        return;
      }
      
      console.log(`Updated ${replacementCount} IDs in initial-data.ts`);
      closeDb();
    });
  });
});

// Function to close the database
function closeDb() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('\nDatabase connection closed');
    }
  });
}
