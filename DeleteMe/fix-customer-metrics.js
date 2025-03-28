/**
 * Fix Customer Metrics Script
 * This script:
 * 1. Removes incorrect "Customers" rows between Key Metrics and Accounts
 * 2. Ensures correct Customer Metrics rows after Historical Data have proper chart group label
 */

const fs = require('fs');
const path = require('path');

// Main function to fix customer metrics
async function fixCustomerMetrics() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-customers-' + Date.now();
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
    
    // Find the incorrect "Customers" rows between Key Metrics and Accounts
    const keyMetricsObjects = parsedObjects.filter(obj => obj.chartGroup === 'Key Metrics');
    const accountsObjects = parsedObjects.filter(obj => obj.chartGroup === 'Accounts');
    
    // Find objects with chartName "Customers" that are not in the correct position
    const incorrectCustomersObjects = parsedObjects.filter(obj => 
      obj.chartName === 'Customers' && 
      obj.chartGroup === 'Customer Metrics' &&
      // Find objects that appear after Key Metrics and before Accounts
      parsedObjects.indexOf(obj) > parsedObjects.indexOf(keyMetricsObjects[keyMetricsObjects.length - 1]) &&
      parsedObjects.indexOf(obj) < parsedObjects.indexOf(accountsObjects[0])
    );
    
    console.log(`Found ${incorrectCustomersObjects.length} incorrect "Customers" rows to remove`);
    
    // Find the correct Customer Metrics rows after Historical Data
    const historicalDataObjects = parsedObjects.filter(obj => obj.chartGroup === 'Historical Data');
    
    // Find objects that should be Customer Metrics after Historical Data
    const correctCustomerMetricsObjects = parsedObjects.filter(obj => 
      obj.chartName === 'Customers' &&
      // Find objects that appear after Historical Data
      parsedObjects.indexOf(obj) > parsedObjects.indexOf(historicalDataObjects[historicalDataObjects.length - 1])
    );
    
    console.log(`Found ${correctCustomerMetricsObjects.length} correct Customer Metrics rows to update`);
    
    // Create a new array without the incorrect Customers rows
    const filteredObjects = parsedObjects.filter(obj => !incorrectCustomersObjects.includes(obj));
    
    console.log(`Removed ${parsedObjects.length - filteredObjects.length} incorrect rows`);
    
    // Update the chart group for the correct Customer Metrics rows
    filteredObjects.forEach(obj => {
      if (correctCustomerMetricsObjects.some(correctObj => correctObj.id === obj.id)) {
        obj.chartGroup = 'Customer Metrics';
      }
    });
    
    // Rebuild the file content
    let newArrayContent = filteredObjects.map(obj => {
      // Update the chartGroup in the original object string if needed
      if (correctCustomerMetricsObjects.some(correctObj => correctObj.id === obj.id)) {
        return obj.original.replace(
          /chartGroup:\s*["']([^"']*)["']/,
          `chartGroup: "Customer Metrics"`
        );
      }
      return obj.original;
    }).join(',\n    ');
    
    // Rebuild the full file content
    let newFileContent = fileContent.substring(0, startIndex + startMarker.length) + 
      '\n    ' + newArrayContent + '\n' + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully updated customer metrics in the file');
    
    // Verify the changes
    console.log('\nVerifying changes...');
    
    // Count chart groups in the updated file
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    
    const chartGroupCounts = {
      'Key Metrics': (updatedFileContent.match(/chartGroup:\s*["']Key Metrics["']/g) || []).length,
      'Customer Metrics': (updatedFileContent.match(/chartGroup:\s*["']Customer Metrics["']/g) || []).length,
      'Historical Data': (updatedFileContent.match(/chartGroup:\s*["']Historical Data["']/g) || []).length,
      'Accounts': (updatedFileContent.match(/chartGroup:\s*["']Accounts["']/g) || []).length,
      'Inventory': (updatedFileContent.match(/chartGroup:\s*["']Inventory["']/g) || []).length,
      'Por Overview': (updatedFileContent.match(/chartGroup:\s*["']Por Overview["']/g) || []).length,
      'Daily Orders': (updatedFileContent.match(/chartGroup:\s*["']Daily Orders["']/g) || []).length,
      'Web Orders': (updatedFileContent.match(/chartGroup:\s*["']Web Orders["']/g) || []).length,
      'Ar Aging': (updatedFileContent.match(/chartGroup:\s*["']Ar Aging["']/g) || []).length,
      'Site Distribution': (updatedFileContent.match(/chartGroup:\s*["']Site Distribution["']/g) || []).length
    };
    
    console.log('\nChart Group Counts After Update:');
    Object.entries(chartGroupCounts).forEach(([chartGroup, count]) => {
      console.log(`${chartGroup}: ${count} rows`);
    });
    
    // Count chart names in the updated file
    const chartNameCounts = {
      'Key Metrics': (updatedFileContent.match(/chartName:\s*["']Key Metrics["']/g) || []).length,
      'Customers': (updatedFileContent.match(/chartName:\s*["']Customers["']/g) || []).length,
      'Historical Data': (updatedFileContent.match(/chartName:\s*["']Historical Data["']/g) || []).length,
      'Accounts': (updatedFileContent.match(/chartName:\s*["']Accounts["']/g) || []).length,
      'Inventory': (updatedFileContent.match(/chartName:\s*["']Inventory["']/g) || []).length,
      'Por Overview': (updatedFileContent.match(/chartName:\s*["']Por Overview["']/g) || []).length,
      'Orders': (updatedFileContent.match(/chartName:\s*["']Orders["']/g) || []).length,
      'Web Orders': (updatedFileContent.match(/chartName:\s*["']Web Orders["']/g) || []).length,
      'AR Aging': (updatedFileContent.match(/chartName:\s*["']AR Aging["']/g) || []).length,
      'Site Distribution': (updatedFileContent.match(/chartName:\s*["']Site Distribution["']/g) || []).length
    };
    
    console.log('\nChart Name Counts After Update:');
    Object.entries(chartNameCounts).forEach(([chartName, count]) => {
      console.log(`${chartName}: ${count} rows`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixCustomerMetrics();
