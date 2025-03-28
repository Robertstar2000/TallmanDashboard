/**
 * Analyze Chart Names Script
 * This script:
 * 1. Analyzes all chart names in the initial-data.ts file
 * 2. Identifies rows with missing or inconsistent chart names
 */

const fs = require('fs');
const path = require('path');

// Main function to analyze chart names
async function analyzeChartNames() {
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
            original: objStr
          });
        }
      } catch (error) {
        console.error('Error parsing object:', objStr);
      }
    }
    
    console.log(`Successfully parsed ${parsedObjects.length} objects`);
    
    // Group objects by chart group
    const chartGroups = {};
    parsedObjects.forEach(obj => {
      const group = obj.chartGroup || 'Unknown';
      if (!chartGroups[group]) {
        chartGroups[group] = [];
      }
      chartGroups[group].push(obj);
    });
    
    // Analyze chart names
    console.log('\nChart Name Analysis:');
    
    const missingChartNames = parsedObjects.filter(obj => !obj.chartName);
    console.log(`Found ${missingChartNames.length} rows with missing chart names`);
    
    if (missingChartNames.length > 0) {
      console.log('\nRows with missing chart names:');
      missingChartNames.forEach(obj => {
        console.log(`ID: ${obj.id}, Name: ${obj.name}, Chart Group: ${obj.chartGroup}`);
      });
    }
    
    // Check for inconsistent chart names within chart groups
    console.log('\nChart Name Consistency Analysis:');
    
    Object.entries(chartGroups).forEach(([group, objects]) => {
      const chartNames = new Set(objects.map(obj => obj.chartName));
      
      if (chartNames.size > 1) {
        console.log(`\nChart Group "${group}" has ${chartNames.size} different chart names:`);
        
        // Group by chart name
        const chartNameGroups = {};
        objects.forEach(obj => {
          const chartName = obj.chartName || 'Missing';
          if (!chartNameGroups[chartName]) {
            chartNameGroups[chartName] = [];
          }
          chartNameGroups[chartName].push(obj);
        });
        
        // Print chart name groups
        Object.entries(chartNameGroups).forEach(([chartName, objs]) => {
          console.log(`  - "${chartName}": ${objs.length} rows`);
        });
      } else if (chartNames.size === 1) {
        const chartName = Array.from(chartNames)[0];
        console.log(`Chart Group "${group}" consistently uses chart name "${chartName}"`);
      } else {
        console.log(`Chart Group "${group}" has no chart names defined`);
      }
    });
    
    // Create a mapping of recommended chart names for each chart group
    const recommendedChartNames = {
      'Key Metrics': 'Key Metrics',
      'Customer Metrics': 'Customers',
      'Historical Data': 'Historical Data',
      'Accounts': 'Accounts',
      'Inventory': 'Inventory',
      'Por Overview': 'Por Overview',
      'Daily Orders': 'Orders',
      'Web Orders': 'Web Orders',
      'Ar Aging': 'AR Aging',
      'Site Distribution': 'Site Distribution'
    };
    
    console.log('\nRecommended Chart Names:');
    Object.entries(recommendedChartNames).forEach(([group, chartName]) => {
      console.log(`Chart Group "${group}" should use chart name "${chartName}"`);
    });
    
    // Create a detailed report of all rows
    const report = {
      totalRows: parsedObjects.length,
      missingChartNames: missingChartNames.length,
      chartGroups: Object.fromEntries(
        Object.entries(chartGroups).map(([group, objects]) => [
          group,
          {
            count: objects.length,
            chartNames: Array.from(new Set(objects.map(obj => obj.chartName))),
            missingChartNames: objects.filter(obj => !obj.chartName).length
          }
        ])
      ),
      recommendedChartNames
    };
    
    // Write the report to a file
    fs.writeFileSync('chart-names-analysis.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report written to chart-names-analysis.json');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
analyzeChartNames();
