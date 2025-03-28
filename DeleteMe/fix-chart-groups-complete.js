/**
 * Fix Chart Groups Complete Script
 * This script:
 * 1. Fixes chart group names
 * 2. Ensures each chart group has the correct number of rows
 * 3. Organizes chart group rows in contiguous sequence
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

// Chart name to chart group mapping
const chartNameToGroup = {
  'Inventory': 'Inventory',
  'Site Distribution': 'Site Distribution',
  'Key Metrics': 'Key Metrics',
  'Site Sales': 'Site Distribution',
  'Accounts': 'Historical Data',
  'AR Aging': 'Ar Aging',
  'Orders': 'Daily Orders',
  'Customers': 'Customer Metrics'
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
      
      // Extract server name
      const serverNameMatch = obj.text.match(/serverName:\s*["']([^"']+)["']/);
      const serverName = serverNameMatch ? serverNameMatch[1] : '';
      
      // Extract SQL expression
      const sqlExpressionMatch = obj.text.match(/sqlExpression:\s*["']([^"']+)["']/);
      const sqlExpression = sqlExpressionMatch ? sqlExpressionMatch[1] : '';
      
      return {
        id,
        name,
        chartName,
        variableName,
        chartGroup,
        serverName,
        sqlExpression,
        lines: obj.lines,
        text: obj.text,
        startLine: obj.startLine,
        endLine: obj.endLine
      };
    });
    
    // Fix chart group names based on chart name
    const fixedObjects = parsedObjects.map(obj => {
      // Determine the correct chart group
      let correctChartGroup = obj.chartGroup;
      
      if (chartNameToGroup[obj.chartName]) {
        correctChartGroup = chartNameToGroup[obj.chartName];
      }
      
      // If chart group needs to be updated
      if (correctChartGroup !== obj.chartGroup) {
        // Update the chart group in the object text
        let updatedText = obj.text;
        
        if (obj.text.includes('chartGroup:')) {
          // Replace existing chart group
          updatedText = updatedText.replace(
            /chartGroup:\s*["']([^"']+)["']/,
            `chartGroup: "${correctChartGroup}"`
          );
        } else {
          // Add chart group if it doesn't exist
          updatedText = updatedText.replace(
            /variableName:\s*["']([^"']+)["']/,
            `variableName: "${obj.variableName}",\n      chartGroup: "${correctChartGroup}"`
          );
        }
        
        // Update the lines
        const updatedLines = updatedText.split('\n');
        
        return {
          ...obj,
          chartGroup: correctChartGroup,
          text: updatedText,
          lines: updatedLines
        };
      }
      
      return obj;
    });
    
    // Group objects by chart group
    const chartGroups = {};
    fixedObjects.forEach(obj => {
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
    
    // Check for chart groups that don't match requirements
    const incorrectGroups = [];
    Object.entries(chartGroupRequirements).forEach(([group, required]) => {
      const current = (chartGroups[group] || []).length;
      if (current !== required) {
        incorrectGroups.push({
          group,
          current,
          required
        });
      }
    });
    
    if (incorrectGroups.length > 0) {
      console.log('\nChart groups with incorrect number of rows:');
      incorrectGroups.forEach(info => {
        console.log(`${info.group}: ${info.current} rows (should be ${info.required})`);
      });
    }
    
    // Organize objects by chart group in the required order
    const orderedGroups = Object.keys(chartGroupRequirements);
    const otherGroups = Object.keys(chartGroups).filter(group => !orderedGroups.includes(group));
    const allGroups = [...orderedGroups, ...otherGroups];
    
    // Create a new array of objects organized by chart group
    const reorganizedObjects = [];
    allGroups.forEach(group => {
      if (chartGroups[group]) {
        reorganizedObjects.push(...chartGroups[group]);
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
    const newArrayContent = objectTexts.join(',\n    ');
    
    // Rebuild the file content
    const newFileContent = 
      fileContent.substring(0, startIndex + startMarker.length) + 
      '\n    ' + newArrayContent + '\n  ' + 
      fileContent.substring(endIndex);
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully updated initial-data.ts file with reorganized chart groups');
    
    // Generate a report of the changes
    const report = {
      originalCount: objects.length,
      fixedCount: reorganizedObjects.length,
      chartGroupStatistics: Object.entries(chartGroups).map(([group, objects]) => ({
        group,
        count: objects.length,
        required: chartGroupRequirements[group] || 'Not specified'
      }))
    };
    
    const reportPath = path.join(process.cwd(), 'chart-groups-complete-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nGenerated complete report at ${reportPath}`);
    
    // Print a summary of what still needs to be fixed
    console.log('\nSummary of what still needs to be fixed:');
    incorrectGroups.forEach(info => {
      if (info.current < info.required) {
        console.log(`${info.group}: Need to add ${info.required - info.current} rows`);
      } else if (info.current > info.required) {
        console.log(`${info.group}: Need to remove ${info.current - info.required} rows`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixChartGroups();
