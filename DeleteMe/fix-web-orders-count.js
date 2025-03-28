/**
 * Script to fix Web Orders count in initial-data.ts
 * This script ensures that there are exactly 12 Web Orders rows (one for each month)
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-web-orders-fix-${Date.now()}`;
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Extract the initialSpreadsheetData array
const dataStartIndex = content.indexOf('export const initialSpreadsheetData');
const dataEndIndex = content.indexOf('// Chart group settings');

if (dataStartIndex === -1 || dataEndIndex === -1) {
  console.error('Could not find the initialSpreadsheetData array in the file');
  process.exit(1);
}

// Parse the data section
let dataSection = content.substring(dataStartIndex, dataEndIndex);

// Function to fix Web Orders count
function fixWebOrdersCount(dataSection) {
  // Extract all rows
  const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,[\s\S]*?}/g;
  const allRows = [];
  const webOrdersRows = [];
  let match;
  
  while ((match = rowRegex.exec(dataSection)) !== null) {
    const row = match[0];
    const chartGroupMatch = row.match(/chartGroup:\s*["']([^"']+)["']/);
    const chartGroup = chartGroupMatch ? chartGroupMatch[1] : '';
    
    if (chartGroup.toLowerCase() === 'web orders') {
      webOrdersRows.push(row);
    } else {
      allRows.push(row);
    }
  }
  
  // Count current Web Orders rows
  console.log(`Current Web Orders count: ${webOrdersRows.length}`);
  
  if (webOrdersRows.length > 12) {
    console.log(`Fixing Web Orders count: ${webOrdersRows.length} -> 12`);
    
    // Keep only the first 12 Web Orders rows
    const keptWebOrdersRows = webOrdersRows.slice(0, 12);
    
    // Rebuild the data section
    const arrayStartIndex = dataSection.indexOf('[');
    const arrayEndIndex = dataSection.lastIndexOf(']');
    
    if (arrayStartIndex === -1 || arrayEndIndex === -1) {
      console.error('Could not find the array boundaries in the data section');
      return dataSection;
    }
    
    // Combine all rows and Web Orders rows
    const combinedRows = [...allRows, ...keptWebOrdersRows];
    
    // Sort rows to maintain the original order
    combinedRows.sort((a, b) => {
      const idA = a.match(/id:\s*['"]([^'"]+)['"]/)[1];
      const idB = b.match(/id:\s*['"]([^'"]+)['"]/)[1];
      return idA.localeCompare(idB);
    });
    
    // Rebuild the array
    let newArrayContent = combinedRows.join(',\n  ');
    
    // Replace the array content
    const newDataSection = dataSection.substring(0, arrayStartIndex + 1) + '\n  ' + 
                          newArrayContent + '\n' + 
                          dataSection.substring(arrayEndIndex);
    
    return newDataSection;
  }
  
  return dataSection;
}

// Fix Web Orders count
const updatedDataSection = fixWebOrdersCount(dataSection);

// Replace the data section in the content
const updatedContent = content.substring(0, dataStartIndex) + updatedDataSection + content.substring(dataEndIndex);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Fixed Web Orders count in initial-data.ts');

// Count the number of rows for each chart group
function countChartGroupRows(dataSection) {
  const chartGroups = {};
  const rows = dataSection.match(/chartGroup:\s*["']([^"']+)["']/g) || [];
  
  rows.forEach(match => {
    const chartGroup = match.match(/["']([^"']+)["']/)[1];
    chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
  });
  
  return chartGroups;
}

// Count current rows for each chart group
const currentCounts = countChartGroupRows(updatedDataSection);
console.log('\nCurrent chart group counts:');
Object.entries(currentCounts).forEach(([group, count]) => {
  console.log(`${group}: ${count} rows`);
});

// Define the expected chart groups and their row counts
const expectedChartGroups = {
  'Key Metrics': 7,
  'Site Distribution': 3,
  'Accounts': 36,
  'Customer Metrics': 24,
  'Historical Data': 36,
  'Inventory': 8,
  'POR Overview': 36,
  'Daily Orders': 7,
  'Web Orders': 12,
  'AR Aging': 5
};

// Verify that all chart groups have the expected number of rows
console.log('\nVerifying chart group row counts:');
let allCorrect = true;
Object.entries(expectedChartGroups).forEach(([group, expectedCount]) => {
  const actualCount = currentCounts[group] || 0;
  const isCorrect = actualCount === expectedCount;
  console.log(`${group}: ${actualCount}/${expectedCount} rows ${isCorrect ? '✓' : '✗'}`);
  if (!isCorrect) allCorrect = false;
});

if (allCorrect) {
  console.log('\n✅ All chart groups have the correct number of rows');
} else {
  console.log('\n⚠️ Some chart groups do not have the expected number of rows');
}
