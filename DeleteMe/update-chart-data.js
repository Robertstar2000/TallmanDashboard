const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// Read the current content
console.log('Reading initial-data.ts file...');
let content = fs.readFileSync(filePath, 'utf8');

// Extract the initialSpreadsheetData array
console.log('Extracting initialSpreadsheetData array...');
const dataStartRegex = /export const initialSpreadsheetData: SpreadsheetRow\[] = \[/;
const dataEndRegex = /\];(\r?\n\r?\n\/\/ Chart group settings)/;

const dataStartMatch = content.match(dataStartRegex);
const dataEndMatch = content.match(dataEndRegex);

if (!dataStartMatch || !dataEndMatch) {
  console.error('Could not find initialSpreadsheetData array in the file');
  process.exit(1);
}

const dataStartIndex = dataStartMatch.index + dataStartMatch[0].length;
const dataEndIndex = dataEndMatch.index;

// Extract the data array as a string
const dataArrayString = content.substring(dataStartIndex, dataEndIndex);

// Parse the data array
console.log('Parsing data array...');
let dataArray;
try {
  // Add brackets back to make it a valid JSON array
  dataArray = JSON.parse('[' + dataArrayString + ']');
} catch (error) {
  console.error('Error parsing data array:', error);
  
  // Try an alternative approach - use eval (less safe but more flexible)
  try {
    console.log('Trying alternative parsing approach...');
    // Create a temporary file with just the array
    const tempFilePath = path.join(process.cwd(), 'temp-data-array.js');
    fs.writeFileSync(tempFilePath, 'module.exports = [' + dataArrayString + '];');
    
    // Require the temporary file
    dataArray = require('./temp-data-array.js');
    
    // Delete the temporary file
    fs.unlinkSync(tempFilePath);
  } catch (evalError) {
    console.error('Error with alternative parsing approach:', evalError);
    process.exit(1);
  }
}

// Update each item in the data array
console.log('Updating data array...');
const updatedDataArray = dataArray.map(item => {
  // Ensure chartGroup is set and remove chartName
  if (!item.chartGroup && item.chartName) {
    item.chartGroup = item.chartName;
  }
  
  // Create a new object without chartName
  const { chartName, ...rest } = item;
  return rest;
});

// Convert the updated array back to a string with proper formatting
console.log('Converting updated array back to string...');
const updatedDataArrayString = JSON.stringify(updatedDataArray, null, 2)
  .slice(1, -1) // Remove the outer brackets
  .replace(/^  /gm, '  '); // Maintain indentation

// Replace the original data array in the content
const updatedContent = content.substring(0, dataStartIndex) + 
                      updatedDataArrayString + 
                      content.substring(dataEndIndex);

// Write the updated content back to the file
console.log('Writing updated content back to initial-data.ts...');
fs.writeFileSync(filePath, updatedContent);

console.log('Successfully updated chart data in initial-data.ts');
