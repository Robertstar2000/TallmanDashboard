/**
 * Fix Chart Groups Script (Version 2)
 * This script analyzes and fixes all chart groups in the initial-data.ts file
 * - Ensures each chart group has the correct number of rows
 * - Sets the correct chart group value for each row
 * - Organizes chart group rows in contiguous sequence
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

// Main function to fix chart groups
async function fixChartGroups() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup';
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Find the initialSpreadsheetData array
    const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
    const endMarker = 'export const combinedData';
    
    const startIndex = fileContent.indexOf(startMarker);
    const endIndex = fileContent.indexOf(endMarker);
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find initialSpreadsheetData array in the file');
      return;
    }
    
    // Extract the array content
    const arrayContent = fileContent.substring(startIndex + startMarker.length, endIndex).trim();
    
    // Parse the array content to extract individual objects
    const objects = [];
    let currentObject = '';
    let braceCount = 0;
    let inObject = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      
      if (char === '{') {
        braceCount++;
        if (!inObject) {
          inObject = true;
          currentObject = '{';
        } else {
          currentObject += char;
        }
      } else if (char === '}') {
        braceCount--;
        currentObject += char;
        
        if (braceCount === 0 && inObject) {
          inObject = false;
          objects.push(currentObject);
          currentObject = '';
        }
      } else if (inObject) {
        currentObject += char;
      }
    }
    
    console.log(`Found ${objects.length} total objects in the array`);
    
    // Parse each object to extract its properties
    const parsedObjects = objects.map(obj => {
      // Extract id
      const idMatch = obj.match(/id:\s*['"](\d+)['"]/);
      const id = idMatch ? idMatch[1] : '';
      
      // Extract name
      const nameMatch = obj.match(/name:\s*["']([^"']+)["']/);
      const name = nameMatch ? nameMatch[1] : '';
      
      // Extract chart name
      const chartNameMatch = obj.match(/chartName:\s*["']([^"']+)["']/);
      const chartName = chartNameMatch ? chartNameMatch[1] : '';
      
      // Extract variable name
      const variableNameMatch = obj.match(/variableName:\s*["']([^"']+)["']/);
      const variableName = variableNameMatch ? variableNameMatch[1] : '';
      
      // Extract chart group
      const chartGroupMatch = obj.match(/chartGroup:\s*["']([^"']+)["']/);
      const chartGroup = chartGroupMatch ? chartGroupMatch[1] : '';
      
      return {
        id,
        name,
        chartName,
        variableName,
        chartGroup,
        originalObject: obj
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
    console.log('\nChart Group Statistics:');
    Object.entries(chartGroups).forEach(([group, objects]) => {
      console.log(`${group}: ${objects.length} rows`);
    });
    
    // Check for objects with missing chart group
    const missingChartGroup = parsedObjects.filter(obj => !obj.chartGroup);
    if (missingChartGroup.length > 0) {
      console.log(`\nFound ${missingChartGroup.length} objects with missing chart group:`);
      missingChartGroup.forEach(obj => {
        console.log(`ID: ${obj.id}, Name: ${obj.name}, Chart Name: ${obj.chartName}`);
      });
    }
    
    // Check for chart groups that don't match requirements
    const incorrectGroups = [];
    Object.entries(chartGroups).forEach(([group, objects]) => {
      if (chartGroupRequirements[group] && objects.length !== chartGroupRequirements[group]) {
        incorrectGroups.push({
          group,
          current: objects.length,
          required: chartGroupRequirements[group]
        });
      }
    });
    
    if (incorrectGroups.length > 0) {
      console.log('\nChart groups with incorrect number of rows:');
      incorrectGroups.forEach(info => {
        console.log(`${info.group}: ${info.current} rows (should be ${info.required})`);
      });
    }
    
    // Fix missing chart groups based on chart name
    let fixedObjects = [...parsedObjects];
    
    // Map chart names to chart groups
    const chartNameToGroup = {};
    fixedObjects.forEach(obj => {
      if (obj.chartGroup && obj.chartName) {
        chartNameToGroup[obj.chartName] = obj.chartGroup;
      }
    });
    
    // Fix missing chart groups
    fixedObjects = fixedObjects.map(obj => {
      if (!obj.chartGroup && obj.chartName && chartNameToGroup[obj.chartName]) {
        // Update the object with the correct chart group
        const updatedObject = obj.originalObject.replace(
          /chartGroup:\s*["']?([^"',]*)["']?/,
          `chartGroup: "${chartNameToGroup[obj.chartName]}"`
        );
        
        if (updatedObject === obj.originalObject) {
          // If no replacement was made, add the chartGroup property
          const updatedObject = obj.originalObject.replace(
            /variableName:\s*["']([^"']+)["']/,
            `variableName: "${obj.variableName}",\n      chartGroup: "${chartNameToGroup[obj.chartName]}"`
          );
          
          return {
            ...obj,
            chartGroup: chartNameToGroup[obj.chartName],
            originalObject: updatedObject
          };
        }
        
        return {
          ...obj,
          chartGroup: chartNameToGroup[obj.chartName],
          originalObject: updatedObject
        };
      }
      return obj;
    });
    
    // Group objects by chart group again after fixes
    const fixedChartGroups = {};
    fixedObjects.forEach(obj => {
      const group = obj.chartGroup || 'Unknown';
      if (!fixedChartGroups[group]) {
        fixedChartGroups[group] = [];
      }
      fixedChartGroups[group].push(obj);
    });
    
    // Print updated chart group statistics
    console.log('\nUpdated Chart Group Statistics:');
    Object.entries(fixedChartGroups).forEach(([group, objects]) => {
      console.log(`${group}: ${objects.length} rows`);
    });
    
    // Check for chart groups that still don't match requirements
    const stillIncorrectGroups = [];
    Object.entries(fixedChartGroups).forEach(([group, objects]) => {
      if (chartGroupRequirements[group] && objects.length !== chartGroupRequirements[group]) {
        stillIncorrectGroups.push({
          group,
          current: objects.length,
          required: chartGroupRequirements[group]
        });
      }
    });
    
    if (stillIncorrectGroups.length > 0) {
      console.log('\nChart groups still with incorrect number of rows after fixes:');
      stillIncorrectGroups.forEach(info => {
        console.log(`${info.group}: ${info.current} rows (should be ${info.required})`);
      });
    }
    
    // Reorganize objects to group chart groups together
    const orderedGroups = Object.keys(chartGroupRequirements);
    const otherGroups = Object.keys(fixedChartGroups).filter(group => !orderedGroups.includes(group));
    const allGroups = [...orderedGroups, ...otherGroups];
    
    const reorganizedObjects = [];
    allGroups.forEach(group => {
      if (fixedChartGroups[group]) {
        reorganizedObjects.push(...fixedChartGroups[group]);
      }
    });
    
    console.log(`\nReorganized ${reorganizedObjects.length} objects by chart group`);
    
    // Rebuild the array content
    const newArrayContent = reorganizedObjects.map(obj => obj.originalObject).join(',\n    ');
    
    // Rebuild the file content
    const newFileContent = 
      fileContent.substring(0, startIndex + startMarker.length) + 
      '\n    ' + newArrayContent + '\n  ' + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully updated initial-data.ts file');
    
    // Generate a report of the changes
    const report = {
      originalCount: objects.length,
      fixedCount: reorganizedObjects.length,
      missingChartGroupFixed: missingChartGroup.length,
      chartGroupStatistics: Object.entries(fixedChartGroups).map(([group, objects]) => ({
        group,
        count: objects.length,
        required: chartGroupRequirements[group] || 'Not specified'
      }))
    };
    
    const reportPath = path.join(process.cwd(), 'chart-groups-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nGenerated report at ${reportPath}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
fixChartGroups();
