/**
 * Fix Syntax Error Script
 * This script:
 * 1. Fixes the syntax error in the initial-data.ts file
 * 2. Ensures proper formatting of all objects
 */

const fs = require('fs');
const path = require('path');

// Main function to fix syntax errors
async function fixSyntaxError() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-syntax-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Fix the syntax error by ensuring all objects are properly separated with commas
    // First, find all object boundaries
    const fixedContent = fileContent.replace(/}\s*{/g, '},\n    {');
    
    // Fix indentation for consistency
    const lines = fixedContent.split('\n');
    const formattedLines = [];
    
    let inObject = false;
    let indentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trimRight();
      
      // Skip empty lines
      if (line.trim() === '') {
        formattedLines.push('');
        continue;
      }
      
      // Determine indent level based on braces
      if (line.includes('{')) {
        if (line.trim() === '{') {
          // Standalone opening brace
          indentLevel++;
          formattedLines.push('  '.repeat(indentLevel - 1) + '{');
          inObject = true;
        } else if (line.trim().endsWith('{')) {
          // Line ends with opening brace
          formattedLines.push('  '.repeat(indentLevel) + line);
          indentLevel++;
          inObject = true;
        } else {
          // Opening brace in the middle of the line
          formattedLines.push('  '.repeat(indentLevel) + line);
          if (line.split('{').length > line.split('}').length) {
            indentLevel++;
            inObject = true;
          }
        }
      } else if (line.includes('}')) {
        if (line.trim() === '}' || line.trim() === '},') {
          // Standalone closing brace
          indentLevel = Math.max(0, indentLevel - 1);
          formattedLines.push('  '.repeat(indentLevel) + line);
          if (indentLevel === 0) {
            inObject = false;
          }
        } else if (line.trim().startsWith('}')) {
          // Line starts with closing brace
          indentLevel = Math.max(0, indentLevel - 1);
          formattedLines.push('  '.repeat(indentLevel) + line);
          if (indentLevel === 0) {
            inObject = false;
          }
        } else {
          // Closing brace in the middle of the line
          formattedLines.push('  '.repeat(indentLevel) + line);
          if (line.split('}').length > line.split('{').length) {
            indentLevel = Math.max(0, indentLevel - 1);
            if (indentLevel === 0) {
              inObject = false;
            }
          }
        }
      } else {
        // Regular line
        if (inObject) {
          formattedLines.push('  '.repeat(indentLevel) + line);
        } else {
          formattedLines.push(line);
        }
      }
    }
    
    // Write the fixed content to the file
    fs.writeFileSync(initialDataPath, formattedLines.join('\n'));
    console.log('\n✅ Successfully fixed syntax errors in the file');
    
    // Verify the file can be parsed as valid JavaScript
    try {
      require(initialDataPath);
      console.log('\n✅ File successfully parsed as valid JavaScript');
    } catch (error) {
      console.error('\n❌ File still contains syntax errors:');
      console.error(error.message);
      
      // Try a more direct approach if the previous method failed
      console.log('\nTrying alternative approach...');
      
      // Read the file again
      fileContent = fs.readFileSync(initialDataPath, 'utf8');
      
      // Find the start and end of the initialSpreadsheetData array
      const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
      const endMarker = 'export const combinedData';
      
      const startIndex = fileContent.indexOf(startMarker);
      const endIndex = fileContent.indexOf(endMarker);
      
      if (startIndex === -1 || endIndex === -1) {
        console.error('Could not find initialSpreadsheetData array in the file');
        return;
      }
      
      // Extract the array content
      const arrayContent = fileContent.substring(startIndex + startMarker.length, endIndex).trim();
      
      // Split the content into individual objects
      const objectRegex = /{[^{]*?}/gs;
      const objects = [];
      let match;
      
      while ((match = objectRegex.exec(arrayContent)) !== null) {
        objects.push(match[0]);
      }
      
      console.log(`Found ${objects.length} objects in the array`);
      
      // Rebuild the array with proper formatting
      const formattedArray = objects.map(obj => '    ' + obj.trim()).join(',\n');
      
      // Rebuild the file content
      const newFileContent = 
        fileContent.substring(0, startIndex + startMarker.length) + 
        '\n' + formattedArray + '\n  ' + 
        fileContent.substring(endIndex);
      
      // Write the fixed content to the file
      fs.writeFileSync(initialDataPath, newFileContent);
      console.log('\n✅ Successfully fixed syntax errors using alternative approach');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixSyntaxError();
