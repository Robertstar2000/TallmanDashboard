/**
 * Fix Chart Counts Script
 * This script:
 * 1. Ensures each chart name has the correct number of rows
 * 2. Adds or removes rows as needed to match the desired counts
 */

const fs = require('fs');
const path = require('path');

// Main function to fix chart counts
async function fixChartCounts() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-chart-counts-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Define the desired counts for each chart name
    const desiredCounts = {
      'Key Metrics': 7,
      'Customer Metrics': 24,
      'Historical Data': 36,
      'Accounts': 36,
      'Inventory': 8,
      'Por Overview': 36,
      'Daily Orders': 7,
      'Web Orders': 24,
      'Ar Aging': 5,
      'Site Distribution': 3
    };
    
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
    
    // Group objects by chart name
    const chartNameGroups = {};
    
    for (const objStr of objects) {
      const chartNameMatch = objStr.match(/chartName:\s*["']([^"']+)["']/);
      
      if (chartNameMatch) {
        const chartName = chartNameMatch[1];
        
        if (!chartNameGroups[chartName]) {
          chartNameGroups[chartName] = [];
        }
        
        chartNameGroups[chartName].push(objStr);
      }
    }
    
    // Check current counts
    console.log('\nCurrent Chart Name Counts:');
    Object.entries(chartNameGroups).forEach(([chartName, objList]) => {
      console.log(`${chartName}: ${objList.length} rows`);
    });
    
    // Fix counts for each chart name
    let changes = false;
    
    for (const [chartName, desiredCount] of Object.entries(desiredCounts)) {
      const currentCount = chartNameGroups[chartName] ? chartNameGroups[chartName].length : 0;
      
      if (currentCount !== desiredCount) {
        console.log(`\nFixing count for ${chartName}: ${currentCount} -> ${desiredCount}`);
        changes = true;
        
        if (currentCount < desiredCount) {
          // Need to add rows
          console.log(`Adding ${desiredCount - currentCount} rows for ${chartName}`);
          
          // Find the last ID used for this chart name
          let lastId = 0;
          if (chartNameGroups[chartName] && chartNameGroups[chartName].length > 0) {
            for (const objStr of chartNameGroups[chartName]) {
              const idMatch = objStr.match(/id:\s*["'](\d+)["']/);
              if (idMatch) {
                const id = parseInt(idMatch[1], 10);
                if (id > lastId) {
                  lastId = id;
                }
              }
            }
          }
          
          // Create template for new rows
          const templateObj = chartNameGroups[chartName] && chartNameGroups[chartName].length > 0
            ? chartNameGroups[chartName][0]
            : `{
      id: '${lastId + 1}',
      name: "${chartName} ${lastId + 1}",
      chartName: "${chartName}",
      variableName: "New Variable",
      serverName: 'P21',
      value: "0",
      chartGroup: "${chartName}",
      calculation: "COUNT(*)",
      sqlExpression: "SELECT COUNT(*) as value FROM orders",
      productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_date >= DATEADD(day, -7, GETDATE())",
      tableName: "oe_hdr"
    }`;
          
          // Add new rows
          for (let i = 0; i < desiredCount - currentCount; i++) {
            const newId = lastId + i + 1;
            const newObj = templateObj.replace(/id:\s*["']\d+["']/, `id: '${newId}'`);
            
            // Add the new object to the array
            if (i === desiredCount - currentCount - 1) {
              // Last object, don't add a comma
              fileContent = fileContent.replace(endMarker, `    ${newObj}\n  ];`);
            } else {
              // Not the last object, add a comma
              fileContent = fileContent.replace(endMarker, `    ${newObj},\n  ];`);
            }
          }
        } else {
          // Need to remove rows
          console.log(`Removing ${currentCount - desiredCount} rows for ${chartName}`);
          
          // Sort rows by ID to remove the highest IDs first
          chartNameGroups[chartName].sort((a, b) => {
            const idA = parseInt(a.match(/id:\s*["'](\d+)["']/)[1], 10);
            const idB = parseInt(b.match(/id:\s*["'](\d+)["']/)[1], 10);
            return idB - idA;
          });
          
          // Remove excess rows
          for (let i = 0; i < currentCount - desiredCount; i++) {
            const objToRemove = chartNameGroups[chartName][i];
            
            // Remove the object from the file content
            fileContent = fileContent.replace(objToRemove + ',', '');
            fileContent = fileContent.replace(objToRemove, '');
          }
          
          // Clean up any double commas that might have been created
          fileContent = fileContent.replace(/,\s*,/g, ',');
        }
      }
    }
    
    // Write the updated file
    if (changes) {
      fs.writeFileSync(initialDataPath, fileContent);
      console.log('\n✅ Successfully fixed chart counts in the file');
    } else {
      console.log('\nNo changes needed. All chart counts are already correct.');
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
    
    console.log('\nFinal Chart Name Counts:');
    for (const chartName of Object.keys(desiredCounts).sort()) {
      const count = chartNames[chartName] || 0;
      console.log(`${chartName}: ${count} rows`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixChartCounts();
