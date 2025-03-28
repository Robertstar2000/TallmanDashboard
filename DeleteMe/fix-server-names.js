// Script to fix serverName values based on ID ranges
const fs = require('fs');
const path = require('path');

// File paths
const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-servernames-${new Date().toISOString().replace(/:/g, '-')}`);

console.log('Starting serverName fix script...');

// Create a backup
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');
console.log(`Read file content, size: ${fileContent.length} bytes`);

// Find and update all entries based on ID ranges
let p21UpdatedCount = 0;
let porUpdatedCount = 0;

// Use regex to find all entries
const entryRegex = /"id":\s*"(\d+)"[^}]*"serverName":\s*"([^"]*)"/g;
let match;

while ((match = entryRegex.exec(fileContent)) !== null) {
  const id = parseInt(match[1], 10);
  const originalServerName = match[2];
  
  if (id >= 1 && id <= 126) {
    // This should be a P21 entry
    if (originalServerName !== "P21") {
      p21UpdatedCount++;
      console.log(`Updating serverName for ID ${id} from "${originalServerName}" to "P21"`);
      
      // Replace the serverName in the file content
      fileContent = fileContent.replace(
        `"id": "${id}"${match[0].split(`"id": "${id}"`)[1]}`,
        `"id": "${id}"${match[0].split(`"id": "${id}"`)[1].replace(`"serverName": "${originalServerName}"`, `"serverName": "P21"`)}`
      );
    }
  } else if (id >= 127 && id <= 174) {
    // This should be a POR entry
    if (originalServerName !== "POR") {
      porUpdatedCount++;
      console.log(`Updating serverName for ID ${id} from "${originalServerName}" to "POR"`);
      
      // Replace the serverName in the file content
      fileContent = fileContent.replace(
        `"id": "${id}"${match[0].split(`"id": "${id}"`)[1]}`,
        `"id": "${id}"${match[0].split(`"id": "${id}"`)[1].replace(`"serverName": "${originalServerName}"`, `"serverName": "POR"`)}`
      );
    }
  }
}

console.log(`Updated serverName for ${p21UpdatedCount} P21 entries and ${porUpdatedCount} POR entries`);

// Write the updated content back to the file
fs.writeFileSync(filePath, fileContent);
console.log(`Updated file written to ${filePath}`);

console.log('ServerName fix script completed successfully!');
