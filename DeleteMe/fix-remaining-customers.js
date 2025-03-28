/**
 * Fix Remaining Customers Script
 * This script:
 * 1. Removes any remaining rows with chartName "Customers"
 * 2. Verifies all chart names match their chart groups
 */

const fs = require('fs');
const path = require('path');

// Main function to fix remaining customers
async function fixRemainingCustomers() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-remaining-customers-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Extract the initialSpreadsheetData array
    const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
    const endMarker = '  ];';
    
    const startIndex = fileContent.indexOf(startMarker);
    const endIndex = fileContent.indexOf(endMarker, startIndex);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find initialSpreadsheetData array in the file');
      return;
    }
    
    // Extract the array content
    const arrayContent = fileContent.substring(startIndex + startMarker.length, endIndex).trim();
    
    // Parse the array content to extract objects
    const objects = [];
    let currentObject = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      
      if (escapeNext) {
        currentObject += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        currentObject += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"' || char === "'") {
        currentObject += char;
        if (char === '"' && arrayContent[i-1] !== '\\') {
          inString = !inString;
        }
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            currentObject = '{';
          } else {
            currentObject += char;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          currentObject += char;
          
          if (braceCount === 0) {
            // End of object
            objects.push(currentObject.trim());
            currentObject = '';
          }
        } else {
          currentObject += char;
        }
      } else {
        currentObject += char;
      }
    }
    
    console.log(`Found ${objects.length} objects in the array`);
    
    // Find objects with chartName "Customers"
    const customersObjects = objects.filter(obj => obj.includes('chartName: "Customers"'));
    console.log(`Found ${customersObjects.length} objects with chartName "Customers"`);
    
    // Remove objects with chartName "Customers"
    let updatedContent = fileContent;
    for (const obj of customersObjects) {
      updatedContent = updatedContent.replace(obj + ',', '');
      updatedContent = updatedContent.replace(obj, '');
    }
    
    // Clean up any double commas that might have been created
    updatedContent = updatedContent.replace(/,\s*,/g, ',');
    
    // Write the updated file
    if (customersObjects.length > 0) {
      fs.writeFileSync(initialDataPath, updatedContent);
      console.log(`\n✅ Successfully removed ${customersObjects.length} objects with chartName "Customers"`);
    } else {
      console.log('\nNo objects with chartName "Customers" found. No changes made.');
    }
    
    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Count chart names in the updated file
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    const chartNames = {};
    const chartNameRegex = /chartName:\s*["']([^"']+)["']/g;
    
    let match;
    while ((match = chartNameRegex.exec(updatedFileContent)) !== null) {
      const chartName = match[1];
      chartNames[chartName] = (chartNames[chartName] || 0) + 1;
    }
    
    console.log('\nChart Name Counts:');
    Object.entries(chartNames).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixRemainingCustomers();
