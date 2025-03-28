/**
 * Fix Customer Group Fields Script
 * This script:
 * 1. Identifies rows with variable names containing "new customer" or "prospects"
 * 2. Updates their chart group to "Customer Metrics"
 */

const fs = require('fs');
const path = require('path');

// Main function to fix customer group fields
async function fixCustomerGroupFields() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-customer-groups-' + Date.now();
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
    
    // Find rows with variable names containing "new customer" or "prospects"
    const customerRows = parsedObjects.filter(obj => {
      const variableName = obj.variableName.toLowerCase();
      return variableName.includes('new customer') || 
             variableName.includes('prospects') || 
             variableName.includes('customer') && variableName.includes('new');
    });
    
    console.log(`Found ${customerRows.length} rows with customer-related variable names`);
    
    // Update the chart group for these rows
    let updatedContent = fileContent;
    let updatedCount = 0;
    
    customerRows.forEach(row => {
      console.log(`Processing row ID ${row.id}: ${row.variableName}`);
      
      // Check if the chart group is missing or different from "Customer Metrics"
      if (!row.chartGroup || row.chartGroup !== 'Customer Metrics') {
        console.log(`  - Updating chart group for row ID ${row.id} from "${row.chartGroup}" to "Customer Metrics"`);
        
        // Update the chart group
        const pattern = new RegExp(`(id:\\s*["']${row.id}["'][^}]*chartGroup:\\s*)["']([^"']*)["']`);
        if (pattern.test(updatedContent)) {
          updatedContent = updatedContent.replace(pattern, `$1"Customer Metrics"`);
          updatedCount++;
        } else {
          // If chartGroup field doesn't exist, add it
          const pattern2 = new RegExp(`(id:\\s*["']${row.id}["'][^}]*)(\\s*})`);
          updatedContent = updatedContent.replace(pattern2, `$1,\n      chartGroup: "Customer Metrics"$2`);
          updatedCount++;
        }
        
        // Also update the chart name if it's missing or different
        if (!row.chartName || row.chartName !== 'Customers') {
          const chartNamePattern = new RegExp(`(id:\\s*["']${row.id}["'][^}]*chartName:\\s*)["']([^"']*)["']`);
          if (chartNamePattern.test(updatedContent)) {
            updatedContent = updatedContent.replace(chartNamePattern, `$1"Customers"`);
          } else {
            // If chartName field doesn't exist, add it
            const chartNamePattern2 = new RegExp(`(id:\\s*["']${row.id}["'][^}]*)(\\s*})`);
            updatedContent = updatedContent.replace(chartNamePattern2, `$1,\n      chartName: "Customers"$2`);
          }
        }
      }
    });
    
    console.log(`Updated ${updatedCount} rows with customer-related variable names`);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, updatedContent);
    console.log('\n✅ Successfully updated customer group fields in the file');
    
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
fixCustomerGroupFields();
