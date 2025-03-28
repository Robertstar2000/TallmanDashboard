/**
 * Add Historical Data Chart Group Script
 * This script:
 * 1. Adds 36 rows for the Historical Data chart group
 * 2. Preserves all existing chart groups including Accounts
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

// Main function to add Historical Data chart group
async function addHistoricalData() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-historical-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Parse the file to extract objects
    const lines = fileContent.split('\n');
    const objects = [];
    let currentObject = [];
    let inObject = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('{') && !inObject) {
        inObject = true;
        currentObject = [line];
        braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      } else if (inObject) {
        currentObject.push(line);
        braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
        
        if (braceCount === 0) {
          inObject = false;
          
          // Check if this is a valid data object (has id, name, etc.)
          const objectText = currentObject.join('\n');
          if (objectText.includes('id:') && objectText.includes('name:')) {
            objects.push({
              lines: currentObject,
              text: objectText,
              startLine: i - currentObject.length + 1,
              endLine: i
            });
          }
          
          currentObject = [];
        }
      }
    }
    
    console.log(`Found ${objects.length} total objects in the file`);
    
    // Parse each object to extract its properties
    const parsedObjects = objects.map(obj => {
      // Extract id
      const idMatch = obj.text.match(/id:\s*['"](\d+)['"]/);
      const id = idMatch ? idMatch[1] : '';
      
      // Extract name
      const nameMatch = obj.text.match(/name:\s*["']([^"']+)["']/);
      const name = nameMatch ? nameMatch[1] : '';
      
      // Extract chart name
      const chartNameMatch = obj.text.match(/chartName:\s*["']([^"']+)["']/);
      const chartName = chartNameMatch ? chartNameMatch[1] : '';
      
      // Extract variable name
      const variableNameMatch = obj.text.match(/variableName:\s*["']([^"']+)["']/);
      const variableName = variableNameMatch ? variableNameMatch[1] : '';
      
      // Extract chart group
      const chartGroupMatch = obj.text.match(/chartGroup:\s*["']([^"']+)["']/);
      const chartGroup = chartGroupMatch ? chartGroupMatch[1] : '';
      
      return {
        id,
        name,
        chartName,
        variableName,
        chartGroup,
        lines: obj.lines,
        text: obj.text,
        startLine: obj.startLine,
        endLine: obj.endLine
      };
    });
    
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
    
    // Check if we need to add Historical Data rows
    if (!chartGroups['Historical Data'] || chartGroups['Historical Data'].length < chartGroupRequirements['Historical Data']) {
      const currentCount = chartGroups['Historical Data'] ? chartGroups['Historical Data'].length : 0;
      const neededCount = chartGroupRequirements['Historical Data'] - currentCount;
      
      console.log(`\nAdding ${neededCount} rows to Historical Data`);
      
      // Create Historical Data objects
      const historicalDataObjects = [];
      
      for (let i = 0; i < neededCount; i++) {
        highestId++;
        
        // Create a new object based on the template
        const newObject = {
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
        };
        
        // Format the object as text
        const objectText = `    {
      id: '${newObject.id}',
      name: "${newObject.name}",
      chartName: "${newObject.chartName}",
      variableName: "${newObject.variableName}",
      serverName: "${newObject.serverName}",
      value: "${newObject.value}",
      chartGroup: "${newObject.chartGroup}",
      calculation: "${newObject.calculation}",
      sqlExpression: "${newObject.sqlExpression}",
      productionSqlExpression: "${newObject.productionSqlExpression}",
      tableName: "${newObject.tableName}"
    }`;
        
        historicalDataObjects.push(objectText);
      }
      
      // Find the position to insert the Historical Data objects
      // We'll insert them after the Customer Metrics group
      const customerMetricsLastIndex = chartGroups['Customer Metrics'] ? 
        Math.max(...chartGroups['Customer Metrics'].map(obj => obj.endLine)) : -1;
      
      if (customerMetricsLastIndex === -1) {
        console.error('Could not find position to insert Historical Data objects');
        return;
      }
      
      // Insert the Historical Data objects
      const newLines = [...lines];
      newLines.splice(customerMetricsLastIndex + 1, 0, historicalDataObjects.join(',\n'));
      
      // Write the updated file
      fs.writeFileSync(initialDataPath, newLines.join('\n'));
      console.log('\n✅ Successfully added Historical Data rows to the file');
    } else {
      console.log('\nHistorical Data already has the required number of rows');
    }
    
    // Verify the changes
    const updatedFileContent = fs.readFileSync(initialDataPath, 'utf8');
    const historicalDataCount = (updatedFileContent.match(/chartGroup:\s*["']Historical Data["']/g) || []).length;
    
    console.log(`\nVerified ${historicalDataCount} rows with chart group "Historical Data"`);
    
    if (historicalDataCount === chartGroupRequirements['Historical Data']) {
      console.log(`All ${chartGroupRequirements['Historical Data']} Historical Data rows are now present`);
    } else {
      console.error(`Expected ${chartGroupRequirements['Historical Data']} rows with chart group "Historical Data", but found ${historicalDataCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
addHistoricalData();
