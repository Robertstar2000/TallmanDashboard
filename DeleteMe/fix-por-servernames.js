// Script to update serverName to "POR" for all entries with IDs 127-174
const fs = require('fs');
const path = require('path');

// File paths
const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-servernames-${new Date().toISOString().replace(/:/g, '-')}`);

console.log('Starting POR serverName fix script...');

// Create a backup
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');
console.log(`Read file content, size: ${fileContent.length} bytes`);

// Find and update all POR entries (IDs 127-174)
let updatedCount = 0;

// Use regex to find all entries
const entryRegex = /"id":\s*"(\d+)"[^}]*"serverName":\s*"([^"]*)"/g;
let match;

while ((match = entryRegex.exec(fileContent)) !== null) {
  const id = parseInt(match[1], 10);
  const originalServerName = match[2];
  
  // Check if this is a POR entry (ID between 127-174)
  if (id >= 127 && id <= 174 && originalServerName !== "POR") {
    updatedCount++;
    console.log(`Updating serverName for ID ${id} from "${originalServerName}" to "POR"`);
    
    // Replace the serverName in the file content
    fileContent = fileContent.replace(
      `"serverName": "${originalServerName}"`,
      `"serverName": "POR"`
    );
  }
}

console.log(`Updated serverName for ${updatedCount} entries`);

// Write the updated content back to the file
fs.writeFileSync(filePath, fileContent);
console.log(`Updated file written to ${filePath}`);

console.log('POR serverName fix script completed successfully!');
