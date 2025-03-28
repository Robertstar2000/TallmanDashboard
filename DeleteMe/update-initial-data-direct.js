// Script to directly update the initial-data.ts file with the new sequential IDs from the database
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
    
    // Parse the file to extract the rows
    const rows = [];
    let currentRow = null;
    let inSpreadsheetData = false;
    
    const lines = data.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('export const initialSpreadsheetData')) {
        inSpreadsheetData = true;
        continue;
      }
      
      if (inSpreadsheetData) {
        if (line === '{') {
          currentRow = {};
        } else if (line === '},' || line === '}') {
          if (currentRow) {
            rows.push(currentRow);
            currentRow = null;
          }
          
          if (line === '];') {
            inSpreadsheetData = false;
          }
        } else if (currentRow && line.includes(':')) {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim().replace(/[',]/g, '');
            const value = parts.slice(1).join(':').trim().replace(/[',]/g, '');
            currentRow[key] = value;
          }
        }
      }
    }
    
    console.log(`Parsed ${rows.length} rows from initial-data.ts`);
    
    // Update the IDs in the file
    let updatedContent = data;
    let replacementCount = 0;
    
    // Process each row in the file
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.chartGroup && row.variableName) {
        const key = `${row.chartGroup}:${row.variableName}`;
        const newId = idMapping[key];
        
        if (newId) {
          // Find the row in the file and update its ID
          const rowStartIndex = updatedContent.indexOf(`{`, updatedContent.indexOf(`chartGroup: '${row.chartGroup}'`) - 50);
          const rowEndIndex = updatedContent.indexOf(`},`, rowStartIndex);
          
          if (rowStartIndex >= 0 && rowEndIndex > rowStartIndex) {
            const rowContent = updatedContent.substring(rowStartIndex, rowEndIndex + 2);
            
            // Check for different ID field types
            let updatedRowContent = rowContent;
            let replaced = false;
            
            if (rowContent.includes(`id: '`)) {
              updatedRowContent = rowContent.replace(/id:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
              replaced = true;
            } else if (rowContent.includes(`invoice_hdrid: '`)) {
              updatedRowContent = rowContent.replace(/invoice_hdrid:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
              replaced = true;
            } else if (rowContent.includes(`invoice_lineid: '`)) {
              updatedRowContent = rowContent.replace(/invoice_lineid:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
              replaced = true;
            } else if (rowContent.includes(`customerid: '`)) {
              updatedRowContent = rowContent.replace(/customerid:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
              replaced = true;
            } else {
              // If no ID field exists, add one at the beginning of the row
              updatedRowContent = rowContent.replace('{', `{\n    id: '${newId}',`);
              replaced = true;
            }
            
            if (replaced && updatedRowContent !== rowContent) {
              updatedContent = updatedContent.substring(0, rowStartIndex) + 
                              updatedRowContent + 
                              updatedContent.substring(rowEndIndex + 2);
              replacementCount++;
              console.log(`Updated ID for ${key} to ${newId}`);
            }
          }
        }
      }
    }
    
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
