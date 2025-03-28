/**
 * Adjust Chart Group Rows Script
 * This script:
 * 1. Adds missing rows to chart groups that have fewer than required
 * 2. Removes excess rows from chart groups that have more than required
 * 3. Ensures all chart groups have the correct number of rows
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
  'Key Metrics': 7
};

// Template objects for each chart group
const templates = {
  'Customer Metrics': {
    name: "Customer Metrics - Template",
    chartName: "Customers",
    variableName: "Customer Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Customer Metrics",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)",
    productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.customer WITH (NOLOCK)",
    tableName: "customer"
  },
  'Historical Data': {
    name: "Historical Data - Template",
    chartName: "Accounts",
    variableName: "Historical Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Historical Data",
    calculation: "SUM()",
    sqlExpression: "SELECT 0 as value",
    productionSqlExpression: "SELECT 0 as value",
    tableName: "accounts"
  },
  'Inventory': {
    name: "Inventory - Template",
    chartName: "Inventory",
    variableName: "Inventory Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Inventory",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK)",
    productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.inv_mast WITH (NOLOCK)",
    tableName: "inv_mast"
  },
  'Por Overview': {
    name: "Por Overview - Template",
    chartName: "Por Overview",
    variableName: "Por Template",
    serverName: "POR",
    value: "0",
    chartGroup: "Por Overview",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT 0 as value",
    productionSqlExpression: "SELECT 0 as value",
    tableName: "por_data"
  },
  'Daily Orders': {
    name: "Daily Orders - Template",
    chartName: "Orders",
    variableName: "Daily Orders Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Daily Orders",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)",
    productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)",
    tableName: "oe_hdr"
  },
  'Web Orders': {
    name: "Web Orders - Template",
    chartName: "Web Orders",
    variableName: "Web Orders Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Web Orders",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'WEB'",
    productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE order_source = 'WEB'",
    tableName: "oe_hdr"
  },
  'Ar Aging': {
    name: "Ar Aging - Template",
    chartName: "AR Aging",
    variableName: "AR Aging Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Ar Aging",
    calculation: "SUM()",
    sqlExpression: "SELECT 0 as value",
    productionSqlExpression: "SELECT 0 as value",
    tableName: "ar_aging"
  },
  'Site Distribution': {
    name: "Site Distribution - Template",
    chartName: "Site Distribution",
    variableName: "Site Distribution Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Site Distribution",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101'",
    productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK) WHERE location_id = '101'",
    tableName: "oe_hdr"
  },
  'Key Metrics': {
    name: "Key Metrics - Template",
    chartName: "Key Metrics",
    variableName: "Key Metrics Template",
    serverName: "P21",
    value: "0",
    chartGroup: "Key Metrics",
    calculation: "COUNT(*)",
    sqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)",
    productionSqlExpression: "SELECT COUNT(*) as value FROM dbo.oe_hdr WITH (NOLOCK)",
    tableName: "oe_hdr"
  }
};

// Main function to adjust chart group rows
async function adjustChartGroupRows() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-' + Date.now();
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
    
    // Adjust chart groups to match requirements
    const adjustedObjects = [...parsedObjects];
    
    // Add missing rows
    Object.entries(chartGroupRequirements).forEach(([group, required]) => {
      const current = (chartGroups[group] || []).length;
      
      if (current < required) {
        console.log(`\nAdding ${required - current} rows to ${group}`);
        
        // Create template for this group
        const template = templates[group];
        
        // Add the required number of rows
        for (let i = 0; i < required - current; i++) {
          highestId++;
          
          // Create a new object based on the template
          const newObject = {
            id: highestId.toString(),
            name: `${template.name} ${i + 1}`,
            chartName: template.chartName,
            variableName: `${template.variableName} ${i + 1}`,
            serverName: template.serverName,
            value: template.value,
            chartGroup: group,
            calculation: template.calculation,
            sqlExpression: template.sqlExpression,
            productionSqlExpression: template.productionSqlExpression,
            tableName: template.tableName
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
          
          // Add the new object
          adjustedObjects.push({
            id: newObject.id,
            name: newObject.name,
            chartName: newObject.chartName,
            variableName: newObject.variableName,
            chartGroup: newObject.chartGroup,
            text: objectText,
            lines: objectText.split('\n')
          });
        }
      } else if (current > required) {
        console.log(`\nRemoving ${current - required} rows from ${group}`);
        
        // Get the objects for this group
        const groupObjects = chartGroups[group];
        
        // Keep only the required number of objects
        const objectsToKeep = groupObjects.slice(0, required);
        const objectsToRemove = groupObjects.slice(required);
        
        // Remove the excess objects
        objectsToRemove.forEach(obj => {
          const index = adjustedObjects.findIndex(o => o.id === obj.id);
          if (index !== -1) {
            adjustedObjects.splice(index, 1);
          }
        });
      }
    });
    
    // Group adjusted objects by chart group
    const adjustedChartGroups = {};
    adjustedObjects.forEach(obj => {
      const group = obj.chartGroup || 'Unknown';
      if (!adjustedChartGroups[group]) {
        adjustedChartGroups[group] = [];
      }
      adjustedChartGroups[group].push(obj);
    });
    
    // Print adjusted chart group statistics
    console.log('\nAdjusted Chart Group Statistics:');
    Object.entries(adjustedChartGroups).forEach(([group, objects]) => {
      console.log(`${group}: ${objects.length} rows`);
    });
    
    // Organize objects by chart group in the required order
    const orderedGroups = Object.keys(chartGroupRequirements);
    const otherGroups = Object.keys(adjustedChartGroups).filter(group => !orderedGroups.includes(group));
    const allGroups = [...orderedGroups, ...otherGroups];
    
    // Create a new array of objects organized by chart group
    const reorganizedObjects = [];
    allGroups.forEach(group => {
      if (adjustedChartGroups[group]) {
        reorganizedObjects.push(...adjustedChartGroups[group]);
      }
    });
    
    console.log(`\nReorganized ${reorganizedObjects.length} objects by chart group`);
    
    // Find the start and end of the initialSpreadsheetData array
    const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
    const endMarker = '];';
    
    const startIndex = fileContent.indexOf(startMarker);
    let endIndex = fileContent.indexOf(endMarker, startIndex);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find initialSpreadsheetData array in the file');
      return;
    }
    
    // Rebuild the array content
    const objectTexts = reorganizedObjects.map(obj => obj.text);
    const newArrayContent = objectTexts.join(',\n');
    
    // Rebuild the file content
    const newFileContent = 
      fileContent.substring(0, startIndex + startMarker.length) + 
      '\n' + newArrayContent + '\n  ' + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully updated initial-data.ts file with adjusted chart groups');
    
    // Generate a report of the changes
    const report = {
      originalCount: objects.length,
      adjustedCount: reorganizedObjects.length,
      chartGroupStatistics: Object.entries(adjustedChartGroups).map(([group, objects]) => ({
        group,
        count: objects.length,
        required: chartGroupRequirements[group] || 'Not specified'
      }))
    };
    
    const reportPath = path.join(process.cwd(), 'chart-groups-adjusted-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nGenerated adjusted report at ${reportPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
adjustChartGroupRows();
