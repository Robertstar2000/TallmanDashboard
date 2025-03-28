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
    
    // Split the file into lines for easier processing
    const lines = data.split('\n');
    let updatedLines = [];
    let replacementCount = 0;
    let inRow = false;
    let currentChartGroup = '';
    let currentVariableName = '';
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're starting a new row
      if (line.includes('{') && (
          line.includes('id:') || 
          line.includes('invoice_hdrid:') || 
          line.includes('invoice_lineid:') || 
          line.includes('customerid:'))) {
        inRow = true;
      }
      
      // Check for chart group
      if (inRow && line.includes('chartGroup:')) {
        const match = line.match(/chartGroup:\s*['"]([^'"]*)['"]/);
        if (match) {
          currentChartGroup = match[1];
        }
      }
      
      // Check for variable name
      if (inRow && line.includes('variableName:')) {
        const match = line.match(/variableName:\s*['"]([^'"]*)['"]/);
        if (match) {
          currentVariableName = match[1];
        }
      }
      
      // If we have both chart group and variable name, look for ID to replace
      if (inRow && currentChartGroup && currentVariableName && 
          (line.includes('id:') || 
           line.includes('invoice_hdrid:') || 
           line.includes('invoice_lineid:') || 
           line.includes('customerid:'))) {
        
        const key = `${currentChartGroup}:${currentVariableName}`;
        const newId = idMapping[key];
        
        if (newId) {
          // Replace the ID with the new one
          let updatedLine;
          
          if (line.includes('id:')) {
            updatedLine = line.replace(/id:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
          } else if (line.includes('invoice_hdrid:')) {
            updatedLine = line.replace(/invoice_hdrid:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
          } else if (line.includes('invoice_lineid:')) {
            updatedLine = line.replace(/invoice_lineid:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
          } else if (line.includes('customerid:')) {
            updatedLine = line.replace(/customerid:\s*['"]([^'"]*)['"]/g, `id: '${newId}'`);
          }
          
          if (updatedLine !== line) {
            replacementCount++;
            console.log(`Replacing ID for ${key}: ${line.trim()} -> ${updatedLine.trim()}`);
            updatedLines.push(updatedLine);
            continue;
          }
        }
      }
      
      // Check if we're ending a row
      if (line.includes('},')) {
        inRow = false;
        currentChartGroup = '';
        currentVariableName = '';
      }
      
      // Add the unchanged line
      updatedLines.push(line);
    }
    
    // Write the updated file
    fs.writeFile(initialDataPath, updatedLines.join('\n'), 'utf8', (err) => {
      if (err) {
        console.error('Error writing updated initial-data.ts:', err.message);
        closeDb();
        return;
      }
      
      console.log(`Updated ${replacementCount} IDs in initial-data.ts`);
      
      // Update the timestamp in the file
      const timestamp = new Date().toISOString();
      const updatedContent = fs.readFileSync(initialDataPath, 'utf8')
        .replace(/Last updated: .*Z/, `Last updated: ${timestamp}`);
      
      fs.writeFileSync(initialDataPath, updatedContent, 'utf8');
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
