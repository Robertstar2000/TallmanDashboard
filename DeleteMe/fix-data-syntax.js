/**
 * Fix Data Syntax Script
 * This script:
 * 1. Reads the initial-data.ts file
 * 2. Fixes any syntax errors
 * 3. Rewrites the file with correct syntax
 */

const fs = require('fs');
const path = require('path');

// Main function to fix data syntax
async function fixDataSyntax() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-syntax-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Extract the file header (imports and type definitions)
    const headerEndIndex = fileContent.indexOf('export const initialSpreadsheetData: SpreadsheetRow[] = [');
    const header = fileContent.substring(0, headerEndIndex + 'export const initialSpreadsheetData: SpreadsheetRow[] = ['.length);
    
    // Extract the file footer (everything after the array)
    const footerStartIndex = fileContent.lastIndexOf('];');
    const footer = fileContent.substring(footerStartIndex);
    
    // Extract the array content
    const arrayContent = fileContent.substring(headerEndIndex + 'export const initialSpreadsheetData: SpreadsheetRow[] = ['.length, footerStartIndex);
    
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
        if ((char === '"' || char === "'") && arrayContent[i-1] !== '\\') {
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
    
    // Clean up each object and ensure it has valid syntax
    const cleanedObjects = objects.map(obj => {
      // Remove any whitespace or commas at the beginning or end
      return obj.trim().replace(/^,+|,+$/g, '');
    }).filter(obj => obj && obj.length > 2); // Filter out any empty objects
    
    console.log(`Cleaned ${cleanedObjects.length} objects`);
    
    // Rebuild the file content with cleaned objects
    const newArrayContent = cleanedObjects.join(',\n    ');
    const newFileContent = header + '\n    ' + newArrayContent + '\n' + footer;
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully fixed syntax in the file');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixDataSyntax();
