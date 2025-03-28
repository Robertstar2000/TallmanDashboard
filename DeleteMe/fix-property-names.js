// JavaScript script to fix the property names in complete-chart-data.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-props-${new Date().toISOString().replace(/:/g, '-')}`);

console.log(`Starting property name fix at ${new Date().toISOString()}`);

// Create a backup of the current file
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');

// Parse the file to extract the array of data
const arrayStartIndex = fileContent.indexOf('export const initialSpreadsheetData: SpreadsheetRow[] = [');
const arrayEndIndex = fileContent.lastIndexOf('];');

if (arrayStartIndex === -1 || arrayEndIndex === -1) {
    console.error('Could not find the array in the file');
    process.exit(1);
}

// Extract the array content
const arrayContent = fileContent.substring(arrayStartIndex, arrayEndIndex + 2);

// Parse the array content to extract individual objects
const objects = [];
let currentObject = '';
let bracketCount = 0;
let inObject = false;

for (let i = arrayContent.indexOf('[') + 1; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    
    if (char === '{') {
        bracketCount++;
        inObject = true;
    } else if (char === '}') {
        bracketCount--;
        if (bracketCount === 0) {
            currentObject += char;
            objects.push(currentObject.trim());
            currentObject = '';
            inObject = false;
        }
    }
    
    if (inObject) {
        currentObject += char;
    }
}

// Process each object to update property names
const updatedObjects = objects.map(objStr => {
    try {
        // Convert the string to a valid JSON by replacing single quotes and fixing trailing commas
        const jsonStr = objStr
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*\]/g, ']');
        
        // Parse the JSON string to an object
        const obj = Function('return ' + jsonStr)();
        
        // Create a new object with the updated property names
        const updatedObj = {
            ...obj,
            name: obj.DataPoint || '',
            chartName: obj.chartGroup || '',
        };
        
        // Remove the DataPoint property if it exists
        if (updatedObj.DataPoint) {
            delete updatedObj.DataPoint;
        }
        
        // Convert the updated object back to a string
        return JSON.stringify(updatedObj, null, 2);
    } catch (error) {
        console.error(`Error processing object: ${objStr}`);
        console.error(error);
        return objStr;
    }
});

// Reconstruct the file content with the updated objects
const beforeArray = fileContent.substring(0, arrayStartIndex);
const afterArray = fileContent.substring(arrayEndIndex + 2);

const updatedArrayContent = `export const initialSpreadsheetData: SpreadsheetRow[] = [
  ${updatedObjects.join(',\n  ')}
];`;

const updatedFileContent = beforeArray + updatedArrayContent + afterArray;

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedFileContent);

console.log(`\nProperty name fix completed at ${new Date().toISOString()}!`);
