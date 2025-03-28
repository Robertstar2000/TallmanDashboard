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
    
    // Process the file content
    let updatedContent = data;
    let replacementCount = 0;
    
    // Find all object declarations in the initialSpreadsheetData array
    const regex = /{\s*(?:id|invoice_hdrid|invoice_lineid|customerid):\s*['"]([^'"]*)['"]/g;
    const matches = [...data.matchAll(regex)];
    
    // Process each match
    for (const match of matches) {
      const fullMatch = match[0];
      const oldId = match[1];
      
      // Find the chart group and variable name for this object
      const objectStart = data.lastIndexOf('{', match.index);
      const objectEnd = data.indexOf('}', match.index);
      const objectText = data.substring(objectStart, objectEnd);
      
      const chartGroupMatch = objectText.match(/chartGroup:\s*['"]([^'"]*)['"]/);
      const variableNameMatch = objectText.match(/variableName:\s*['"]([^'"]*)['"]/);
      
      if (chartGroupMatch && variableNameMatch) {
        const chartGroup = chartGroupMatch[1];
        const variableName = variableNameMatch[1];
        const key = `${chartGroup}:${variableName}`;
        const newId = idMapping[key];
        
        if (newId) {
          // Replace the old ID with the new one
          const newText = fullMatch.replace(/['"]([^'"]*)['"]/g, `'${newId}'`);
          updatedContent = updatedContent.replace(fullMatch, newText);
          replacementCount++;
          console.log(`Replacing ID for ${key}: ${oldId} -> ${newId}`);
        }
      }
    }
    
    // Also fix any id field type issues (invoice_hdrid, invoice_lineid, customerid -> id)
    updatedContent = updatedContent.replace(/invoice_hdrid:/g, 'id:');
    updatedContent = updatedContent.replace(/invoice_lineid:/g, 'id:');
    updatedContent = updatedContent.replace(/customerid:/g, 'id:');
    
    // Update the timestamp in the file
    const timestamp = new Date().toISOString();
    updatedContent = updatedContent.replace(/Last updated: .*Z/, `Last updated: ${timestamp}`);
    
    // Write the updated file
    fs.writeFile(initialDataPath, updatedContent, 'utf8', (err) => {
      if (err) {
        console.error('Error writing updated initial-data.ts:', err.message);
        closeDb();
        return;
      }
      
      console.log(`Updated ${replacementCount} IDs in initial-data.ts`);
      console.log(`Updated timestamp to ${timestamp}`);
      
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
