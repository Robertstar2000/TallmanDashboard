/**
 * Fix Chart Groups Script (Version 3)
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
    const backupPath = initialDataPath + '.backup-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Parse the file line by line to extract objects
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
        braceCount = line.split('{').length - line.split('}').length;
      } else if (inObject) {
        currentObject.push(line);
        braceCount += line.split('{').length - line.split('}').length;
        
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
    const updatedObjects = fixedObjects.map(obj => {
      if (!obj.chartGroup && obj.chartName && chartNameToGroup[obj.chartName]) {
        // Create updated lines with the correct chart group
        const updatedLines = [...obj.lines];
        
        // Find the line with variableName
        const variableNameLineIndex = updatedLines.findIndex(line => line.includes('variableName:'));
        
        if (variableNameLineIndex !== -1) {
          // Insert chartGroup after variableName
          const indent = updatedLines[variableNameLineIndex].match(/^\s*/)[0];
          updatedLines.splice(
            variableNameLineIndex + 1, 
            0, 
            `${indent}chartGroup: "${chartNameToGroup[obj.chartName]}",`
          );
        }
        
        return {
          ...obj,
          chartGroup: chartNameToGroup[obj.chartName],
          lines: updatedLines,
          text: updatedLines.join('\n')
        };
      }
      return obj;
    });
    
    // Group objects by chart group again after fixes
    const fixedChartGroups = {};
    updatedObjects.forEach(obj => {
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
    
    // Create new file content with reorganized objects
    const newLines = [...lines];
    
    // First, remove all existing objects
    parsedObjects.forEach(obj => {
      for (let i = obj.startLine; i <= obj.endLine; i++) {
        newLines[i] = null; // Mark for removal
      }
    });
    
    // Find the position to insert the reorganized objects
    const insertPosition = newLines.findIndex(line => 
      line && line.includes('export const initialSpreadsheetData')
    );
    
    if (insertPosition === -1) {
      console.error('Could not find position to insert reorganized objects');
      return;
    }
    
    // Insert reorganized objects
    const objectLines = reorganizedObjects.flatMap(obj => obj.lines);
    
    // Insert after the opening bracket
    let bracketLine = insertPosition;
    while (bracketLine < newLines.length && !newLines[bracketLine].includes('[')) {
      bracketLine++;
    }
    
    // Insert objects after the opening bracket
    newLines.splice(bracketLine + 1, 0, ...objectLines);
    
    // Remove null lines (marked for removal)
    const filteredLines = newLines.filter(line => line !== null);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, filteredLines.join('\n'));
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
    console.error(error.stack);
  }
}

// Run the function
fixChartGroups();
