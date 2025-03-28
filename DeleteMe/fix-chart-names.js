/**
 * Fix Chart Names Script
 * This script:
 * 1. Updates chart names in the initial-data.ts file to match their corresponding chart groups
 * 2. Ensures consistency between chart groups and chart names
 */

const fs = require('fs');
const path = require('path');

// Main function to fix chart names
async function fixChartNames() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-chart-names-' + Date.now();
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
    
    // Update each object to make chartName match chartGroup
    let updatedContent = fileContent;
    let updatedCount = 0;
    
    for (const objStr of objects) {
      try {
        // Extract chartGroup using regex
        const chartGroupMatch = objStr.match(/chartGroup:\s*["']([^"']+)["']/);
        
        if (chartGroupMatch) {
          const chartGroup = chartGroupMatch[1];
          
          // Create the updated object with chartName matching chartGroup
          let updatedObjStr = objStr.replace(
            /(chartName:\s*["'])[^"']*["']/,
            `$1${chartGroup}"`
          );
          
          // If the object doesn't have a chartName field, add it
          if (!objStr.includes('chartName:')) {
            updatedObjStr = updatedObjStr.replace(
              /}$/,
              `,\n      chartName: "${chartGroup}"\n    }`
            );
          }
          
          // Replace the original object with the updated one
          if (updatedObjStr !== objStr) {
            updatedContent = updatedContent.replace(objStr, updatedObjStr);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error('Error updating object:', error.message);
      }
    }
    
    console.log(`Updated ${updatedCount} objects to make chartName match chartGroup`);
    
    // Write the updated file
    if (updatedCount > 0) {
      fs.writeFileSync(initialDataPath, updatedContent);
      console.log('\n✅ Successfully updated chart names in the file');
    } else {
      console.log('\nNo changes were made to the file');
    }
    
    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Count chart groups and names in the updated file
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    const chartGroups = {};
    const chartNames = {};
    
    // Extract all chart groups and names
    const chartGroupRegex = /chartGroup:\s*["']([^"']+)["']/g;
    const chartNameRegex = /chartName:\s*["']([^"']+)["']/g;
    
    let match;
    while ((match = chartGroupRegex.exec(updatedFileContent)) !== null) {
      const chartGroup = match[1];
      chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
    }
    
    while ((match = chartNameRegex.exec(updatedFileContent)) !== null) {
      const chartName = match[1];
      chartNames[chartName] = (chartNames[chartName] || 0) + 1;
    }
    
    console.log('\nChart Group Counts:');
    Object.entries(chartGroups).forEach(([chartGroup, count]) => {
      console.log(`${chartGroup}: ${count} rows`);
    });
    
    console.log('\nChart Name Counts:');
    Object.entries(chartNames).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
    // Check for mismatches
    console.log('\nChecking for mismatches between chart groups and chart names:');
    
    const mismatches = [];
    const chartGroupRegexWithId = /id:\s*["']([^"']+)["'].*?chartGroup:\s*["']([^"']+)["']/gs;
    const chartNameRegexWithId = /id:\s*["']([^"']+)["'].*?chartName:\s*["']([^"']+)["']/gs;
    
    const idToChartGroup = {};
    const idToChartName = {};
    
    while ((match = chartGroupRegexWithId.exec(updatedFileContent)) !== null) {
      const id = match[1];
      const chartGroup = match[2];
      idToChartGroup[id] = chartGroup;
    }
    
    while ((match = chartNameRegexWithId.exec(updatedFileContent)) !== null) {
      const id = match[1];
      const chartName = match[2];
      idToChartName[id] = chartName;
    }
    
    for (const id in idToChartGroup) {
      if (idToChartName[id] && idToChartGroup[id] !== idToChartName[id]) {
        mismatches.push({
          id,
          chartGroup: idToChartGroup[id],
          chartName: idToChartName[id]
        });
      }
    }
    
    if (mismatches.length > 0) {
      console.log(`Found ${mismatches.length} mismatches:`);
      mismatches.forEach(mismatch => {
        console.log(`ID: ${mismatch.id}, Chart Group: ${mismatch.chartGroup}, Chart Name: ${mismatch.chartName}`);
      });
    } else {
      console.log('No mismatches found. All chart names match their corresponding chart groups.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixChartNames();
