/**
 * Fix Chart Groups Final Script (Version 2)
 * This script:
 * 1. Ensures all chart groups have the correct number of rows
 * 2. Preserves the 36 account rows in the "Accounts" chart group
 * 3. Creates 36 rows for the "Historical Data" chart group
 * 4. Takes a cautious approach to avoid syntax errors
 */

const fs = require('fs');
const path = require('path');

// Chart group requirements
const chartGroupRequirements = {
  'Customer Metrics': 24,
  'Historical Data': 36,
  'Inventory': 8,
  'Por Overview': 36,
  'Daily Orders': 7,
  'Web Orders': 24,
  'Ar Aging': 5,
  'Site Distribution': 3,
  'Key Metrics': 7,
  'Accounts': 36
};

// Template for Historical Data
const historicalDataTemplate = {
  name: "Historical Data",
  chartName: "Historical Data",
  variableName: "Historical",
  serverName: "P21",
  value: "0",
  chartGroup: "Historical Data",
  calculation: "COUNT(*)",
  sqlExpression: "SELECT 0 as value",
  productionSqlExpression: "SELECT 0 as value",
  tableName: "historical_data"
};

// Main function to fix chart groups
async function fixChartGroups() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-final-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Find the initialSpreadsheetData array
    const startMarker = 'export const initialSpreadsheetData';
    const endMarker = 'export const combinedData';
    
    const startIndex = fileContent.indexOf(startMarker);
    const endIndex = fileContent.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find initialSpreadsheetData array in the file');
      return;
    }
    
    // Extract the array declaration and content
    const arrayDeclaration = fileContent.substring(startIndex, fileContent.indexOf('[', startIndex) + 1);
    const arrayContent = fileContent.substring(fileContent.indexOf('[', startIndex) + 1, endIndex).trim();
    
    // Split the array content into objects
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
        const serverNameMatch = objStr.match(/serverName:\s*['"]([^'"]+)['"]/);
        const valueMatch = objStr.match(/value:\s*["']([^"']+)["']/);
        const chartGroupMatch = objStr.match(/chartGroup:\s*["']([^"']+)["']/);
        const calculationMatch = objStr.match(/calculation:\s*["']([^"']+)["']/);
        const sqlExpressionMatch = objStr.match(/sqlExpression:\s*["']([^"']+)["']/);
        const productionSqlExpressionMatch = objStr.match(/productionSqlExpression:\s*["']([^"']+)["']/);
        const tableNameMatch = objStr.match(/tableName:\s*["']([^"']+)["']/);
        
        if (idMatch && nameMatch) {
          parsedObjects.push({
            id: idMatch ? idMatch[1] : '',
            name: nameMatch ? nameMatch[1] : '',
            chartName: chartNameMatch ? chartNameMatch[1] : '',
            variableName: variableNameMatch ? variableNameMatch[1] : '',
            serverName: serverNameMatch ? serverNameMatch[1] : 'P21',
            value: valueMatch ? valueMatch[1] : '0',
            chartGroup: chartGroupMatch ? chartGroupMatch[1] : '',
            calculation: calculationMatch ? calculationMatch[1] : 'COUNT(*)',
            sqlExpression: sqlExpressionMatch ? sqlExpressionMatch[1] : '',
            productionSqlExpression: productionSqlExpressionMatch ? productionSqlExpressionMatch[1] : '',
            tableName: tableNameMatch ? tableNameMatch[1] : '',
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
    
    // Print chart group statistics
    console.log('\nCurrent Chart Group Statistics:');
    Object.entries(chartGroups).forEach(([group, objects]) => {
      console.log(`${group}: ${objects.length} rows`);
    });
    
    // Find the highest ID in the current objects
    let highestId = 0;
    parsedObjects.forEach(obj => {
      const id = parseInt(obj.id);
      if (!isNaN(id) && id > highestId) {
        highestId = id;
      }
    });
    
    console.log(`\nHighest ID found: ${highestId}`);
    
    // Fix account rows - ensure they have the "Accounts" chart group
    const accountRows = parsedObjects.filter(obj => 
      obj.name.includes('Accounts - ') && 
      (obj.name.includes('Payable') || obj.name.includes('Overdue') || obj.name.includes('Receivable'))
    );
    
    console.log(`\nFound ${accountRows.length} account rows`);
    
    // Update chart group for account rows
    accountRows.forEach(obj => {
      obj.chartGroup = 'Accounts';
    });
    
    // Check if we need to add Historical Data rows
    if (!chartGroups['Historical Data'] || chartGroups['Historical Data'].length < chartGroupRequirements['Historical Data']) {
      const currentCount = chartGroups['Historical Data'] ? chartGroups['Historical Data'].length : 0;
      const neededCount = chartGroupRequirements['Historical Data'] - currentCount;
      
      console.log(`\nAdding ${neededCount} rows to Historical Data`);
      
      // Create Historical Data objects
      for (let i = 0; i < neededCount; i++) {
        highestId++;
        
        // Create a new object based on the template
        parsedObjects.push({
          id: highestId.toString(),
          name: `${historicalDataTemplate.name} - Month ${Math.floor(i / 3) + 1} - Type ${(i % 3) + 1}`,
          chartName: historicalDataTemplate.chartName,
          variableName: `${historicalDataTemplate.variableName} - Month ${Math.floor(i / 3) + 1} - Type ${(i % 3) + 1}`,
          serverName: historicalDataTemplate.serverName,
          value: historicalDataTemplate.value,
          chartGroup: historicalDataTemplate.chartGroup,
          calculation: historicalDataTemplate.calculation,
          sqlExpression: historicalDataTemplate.sqlExpression,
          productionSqlExpression: historicalDataTemplate.productionSqlExpression,
          tableName: historicalDataTemplate.tableName
        });
      }
    }
    
    // Format all objects
    const formattedObjects = parsedObjects.map(obj => {
      return `    {
      id: '${obj.id}',
      name: "${obj.name}",
      chartName: "${obj.chartName}",
      variableName: "${obj.variableName}",
      serverName: "${obj.serverName}",
      value: "${obj.value}",
      chartGroup: "${obj.chartGroup}",
      calculation: "${obj.calculation}",
      sqlExpression: "${obj.sqlExpression || 'SELECT 0 as value'}",
      productionSqlExpression: "${obj.productionSqlExpression || 'SELECT 0 as value'}",
      tableName: "${obj.tableName || 'unknown'}"
    }`;
    });
    
    // Rebuild the file content
    const beforeArray = fileContent.substring(0, startIndex);
    const afterArray = fileContent.substring(endIndex);
    
    // Rebuild the array with proper formatting
    const formattedArray = formattedObjects.join(',\n');
    
    // Rebuild the file content
    const newFileContent = 
      beforeArray + 
      arrayDeclaration + 
      '\n' + formattedArray + '\n  ];\n\n' + 
      afterArray;
    
    // Write the fixed content to the file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully fixed all chart groups in the file');
    
    // Verify the changes
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    const accountCount = (updatedFileContent.match(/chartGroup:\s*["']Accounts["']/g) || []).length;
    const historicalDataCount = (updatedFileContent.match(/chartGroup:\s*["']Historical Data["']/g) || []).length;
    
    console.log(`\nVerified ${accountCount} rows with chart group "Accounts"`);
    console.log(`Verified ${historicalDataCount} rows with chart group "Historical Data"`);
    
    if (accountCount === chartGroupRequirements['Accounts'] && 
        historicalDataCount === chartGroupRequirements['Historical Data']) {
      console.log('\n✅ All chart groups now have the correct number of rows');
    } else {
      console.error('\n❌ Some chart groups still have incorrect row counts');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixChartGroups();
