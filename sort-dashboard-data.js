/**
 * Sort Dashboard Data Script
 * This script:
 * 1. Sorts rows by Chart Name, then Variable Name, then Date (if present)
 * 2. Rewrites the initial-data.ts file with sorted data
 */

const fs = require('fs');
const path = require('path');

// Main function to sort dashboard data
async function sortDashboardData() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-sort-' + Date.now();
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
    
    // Parse each object to extract its properties
    const parsedObjects = [];
    
    for (const objStr of objects) {
      try {
        // Extract properties using regex
        const idMatch = objStr.match(/id:\s*['"]([^'"]+)['"]/);
        const nameMatch = objStr.match(/name:\s*["']([^"']+)["']/);
        const chartNameMatch = objStr.match(/chartName:\s*["']([^"']+)["']/);
        const variableNameMatch = objStr.match(/variableName:\s*["']([^"']+)["']/);
        const timeframeMatch = objStr.match(/timeframe:\s*["']([^"']+)["']/);
        
        if (idMatch && nameMatch) {
          parsedObjects.push({
            id: idMatch ? idMatch[1] : '',
            name: nameMatch ? nameMatch[1] : '',
            chartName: chartNameMatch ? chartNameMatch[1] : '',
            variableName: variableNameMatch ? variableNameMatch[1] : '',
            timeframe: timeframeMatch ? timeframeMatch[1] : '',
            original: objStr
          });
        }
      } catch (error) {
        console.error('Error parsing object:', objStr);
      }
    }
    
    console.log(`Successfully parsed ${parsedObjects.length} objects`);
    
    // Sort the objects by chart name, variable name, and timeframe
    parsedObjects.sort((a, b) => {
      // First sort by chart name
      if (a.chartName !== b.chartName) {
        return a.chartName.localeCompare(b.chartName);
      }
      
      // Then sort by variable name
      if (a.variableName !== b.variableName) {
        return a.variableName.localeCompare(b.variableName);
      }
      
      // Then sort by timeframe if present
      if (a.timeframe && b.timeframe) {
        // If timeframe contains a date, extract and compare it
        const aDate = extractDateFromTimeframe(a.timeframe);
        const bDate = extractDateFromTimeframe(b.timeframe);
        
        if (aDate && bDate) {
          return aDate - bDate;
        }
        
        return a.timeframe.localeCompare(b.timeframe);
      }
      
      // If one has timeframe and the other doesn't, prioritize the one with timeframe
      if (a.timeframe && !b.timeframe) return -1;
      if (!a.timeframe && b.timeframe) return 1;
      
      // If all else is equal, keep original order by ID
      return a.id.localeCompare(b.id);
    });
    
    console.log('Successfully sorted objects');
    
    // Rebuild the file content with sorted objects
    const sortedArrayContent = parsedObjects.map(obj => obj.original).join(',\n    ');
    
    const updatedContent = fileContent.substring(0, startIndex + startMarker.length) + 
      '\n    ' + sortedArrayContent + '\n' + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, updatedContent);
    console.log('\n✅ Successfully sorted dashboard data in the file');
    
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
    
    console.log('\nChart Name Counts After Sorting:');
    Object.keys(chartNames).sort().forEach(chartName => {
      console.log(`${chartName}: ${chartNames[chartName]} rows`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Helper function to extract date from timeframe string
function extractDateFromTimeframe(timeframe) {
  // Check for common date formats
  const dateMatch = timeframe.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    return new Date(dateMatch[0]);
  }
  
  // Check for month names
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  for (let i = 0; i < months.length; i++) {
    if (timeframe.toLowerCase().includes(months[i])) {
      return new Date(0, i, 1); // Use year 0 as a base, we only care about month order
    }
  }
  
  // Check for "Month X" format
  const monthNumberMatch = timeframe.match(/month\s+(\d+)/i);
  if (monthNumberMatch) {
    return parseInt(monthNumberMatch[1], 10);
  }
  
  return null;
}

// Run the function
sortDashboardData();
