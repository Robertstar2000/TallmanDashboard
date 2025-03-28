/**
 * Find Blank Chart Groups Script
 * This script:
 * 1. Identifies rows with blank or missing chart group fields
 * 2. Displays their variable names and other details
 */

const fs = require('fs');
const path = require('path');

// Main function to find blank chart groups
async function findBlankChartGroups() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
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
        const chartGroupMatch = objStr.match(/chartGroup:\s*["']([^"']+)["']/);
        
        if (idMatch && nameMatch) {
          parsedObjects.push({
            id: idMatch ? idMatch[1] : '',
            name: nameMatch ? nameMatch[1] : '',
            chartName: chartNameMatch ? chartNameMatch[1] : '',
            variableName: variableNameMatch ? variableNameMatch[1] : '',
            chartGroup: chartGroupMatch ? chartGroupMatch[1] : '',
            hasChartGroup: !!chartGroupMatch,
            original: objStr
          });
        }
      } catch (error) {
        console.error('Error parsing object:', objStr);
      }
    }
    
    console.log(`Successfully parsed ${parsedObjects.length} objects`);
    
    // Find rows with missing chart group field
    const missingChartGroupRows = parsedObjects.filter(obj => !obj.hasChartGroup);
    
    console.log(`\nFound ${missingChartGroupRows.length} rows with missing chart group field:`);
    
    if (missingChartGroupRows.length > 0) {
      missingChartGroupRows.forEach(row => {
        console.log(`ID: ${row.id}, Name: ${row.name}, Variable Name: ${row.variableName}, Chart Name: ${row.chartName}`);
      });
    }
    
    // Find rows with empty chart group
    const emptyChartGroupRows = parsedObjects.filter(obj => obj.hasChartGroup && (!obj.chartGroup || obj.chartGroup.trim() === ''));
    
    console.log(`\nFound ${emptyChartGroupRows.length} rows with empty chart group field:`);
    
    if (emptyChartGroupRows.length > 0) {
      emptyChartGroupRows.forEach(row => {
        console.log(`ID: ${row.id}, Name: ${row.name}, Variable Name: ${row.variableName}, Chart Name: ${row.chartName}`);
      });
    }
    
    // Find rows with customer-related variable names
    const customerKeywords = ['customer', 'prospect', 'lead', 'client'];
    
    const customerRows = parsedObjects.filter(obj => {
      if (!obj.variableName) return false;
      const variableName = obj.variableName.toLowerCase();
      return customerKeywords.some(keyword => variableName.includes(keyword));
    });
    
    console.log(`\nFound ${customerRows.length} rows with customer-related variable names:`);
    
    if (customerRows.length > 0) {
      customerRows.forEach(row => {
        console.log(`ID: ${row.id}, Name: ${row.name}, Variable Name: ${row.variableName}, Chart Group: ${row.chartGroup || 'MISSING'}, Chart Name: ${row.chartName || 'MISSING'}`);
      });
    }
    
    // Write a detailed report to a file
    const report = {
      totalRows: parsedObjects.length,
      missingChartGroup: missingChartGroupRows.map(row => ({
        id: row.id,
        name: row.name,
        variableName: row.variableName,
        chartName: row.chartName
      })),
      emptyChartGroup: emptyChartGroupRows.map(row => ({
        id: row.id,
        name: row.name,
        variableName: row.variableName,
        chartName: row.chartName
      })),
      customerRelated: customerRows.map(row => ({
        id: row.id,
        name: row.name,
        variableName: row.variableName,
        chartGroup: row.chartGroup,
        chartName: row.chartName
      }))
    };
    
    fs.writeFileSync('chart-group-analysis.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report written to chart-group-analysis.json');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
findBlankChartGroups();
