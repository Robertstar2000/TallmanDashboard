// JavaScript script to fix POR SQL expressions in complete-chart-data.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-${new Date().toISOString().replace(/:/g, '-')}`);

console.log(`Starting POR SQL expression fix at ${new Date().toISOString()}`);

// Create a backup of the current file
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');

// Function to fix POR SQL expressions
function fixPorSqlExpressions(content) {
  // Parse the file content to extract the data array
  const startMarker = 'export const initialSpreadsheetData = [';
  const endMarker = '];';
  
  const startIndex = content.indexOf(startMarker) + startMarker.length;
  const endIndex = content.lastIndexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find the data array in the file');
    return content;
  }
  
  const dataArrayString = content.substring(startIndex, endIndex);
  
  // Split the content into individual objects
  let objects = [];
  let currentObject = '';
  let braceCount = 0;
  
  for (let i = 0; i < dataArrayString.length; i++) {
    const char = dataArrayString[i];
    
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    
    currentObject += char;
    
    if (braceCount === 0 && currentObject.trim()) {
      objects.push(currentObject.trim());
      currentObject = '';
    }
  }
  
  console.log(`Found ${objects.length} objects in the data array`);
  
  // Process each object
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    
    // Check if this is a POR entry (ID between 127-174)
    const idMatch = object.match(/"id":\s*"(\d+)"/);
    if (!idMatch) continue;
    
    const id = parseInt(idMatch[1], 10);
    if (id < 127 || id > 174) continue;
    
    console.log(`Processing POR entry with ID ${id}`);
    
    // Fix SQL expression for POR entries
    let fixedObject = object;
    
    // 1. Remove "dbo." prefixes
    fixedObject = fixedObject.replace(/dbo\./g, '');
    
    // 2. Remove "WITH (NOLOCK)" hints
    fixedObject = fixedObject.replace(/\s+WITH\s+\(NOLOCK\)/gi, '');
    
    // 3. Replace GETDATE() with Date()
    fixedObject = fixedObject.replace(/GETDATE\(\)/gi, 'Date()');
    
    // 4. Replace DATEADD/DATEDIFF with DateAdd/DateDiff and add quotes around interval types
    fixedObject = fixedObject.replace(/DATEADD\((\w+),/gi, (match, interval) => {
      return `DateAdd('${interval}',`;
    });
    
    fixedObject = fixedObject.replace(/DATEDIFF\((\w+),/gi, (match, interval) => {
      return `DateDiff('${interval}',`;
    });
    
    // 5. Ensure all SQL expressions have 'value' as the alias
    if (fixedObject.includes('SELECT') && !fixedObject.includes(' as value') && !fixedObject.includes(' AS value')) {
      fixedObject = fixedObject.replace(/SELECT\s+([^,]+)(\s+FROM)/i, 'SELECT $1 as value$2');
    }
    
    // Update the object in the array
    objects[i] = fixedObject;
  }
  
  // Reconstruct the file content
  const newDataArrayString = objects.join(',\n');
  const newContent = content.substring(0, startIndex) + newDataArrayString + content.substring(endIndex);
  
  return newContent;
}

// Fix the POR SQL expressions
const updatedContent = fixPorSqlExpressions(fileContent);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log(`\nPOR SQL expression fix completed at ${new Date().toISOString()}!`);
