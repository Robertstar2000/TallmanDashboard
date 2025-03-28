// JavaScript script to fix the property names in complete-chart-data.ts using regex
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-regex-${new Date().toISOString().replace(/:/g, '-')}`);

console.log(`Starting property name fix with regex at ${new Date().toISOString()}`);

// Create a backup of the current file
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');

// Use regex to add name and chartName properties to each object
let updatedContent = fileContent.replace(
    /(\s+)"DataPoint":\s*"([^"]+)",\s*\n(\s+)"chartGroup":\s*"([^"]+)"/g,
    '$1"DataPoint": "$2",\n$1"name": "$2",\n$1"chartGroup": "$4",\n$1"chartName": "$4"'
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent);

console.log(`\nProperty name fix completed at ${new Date().toISOString()}!`);
