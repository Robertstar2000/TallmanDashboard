const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// Read the current content
console.log('Reading initial-data.ts file...');
let content = fs.readFileSync(filePath, 'utf8');

// Extract the initialSpreadsheetData array
console.log('Extracting initialSpreadsheetData array...');
const dataStartRegex = /export const initialSpreadsheetData: SpreadsheetRow\[] = \[/;
const dataEndRegex = /\];(\r?\n\r?\n\/\/ Chart group settings)/;

const dataStartMatch = content.match(dataStartRegex);
const dataEndMatch = content.match(dataEndRegex);

if (!dataStartMatch || !dataEndMatch) {
  console.error('Could not find initialSpreadsheetData array in the file');
  process.exit(1);
}

const dataStartIndex = dataStartMatch.index + dataStartMatch[0].length;
const dataEndIndex = dataEndMatch.index;

// Extract the data array as a string
const dataArrayString = content.substring(dataStartIndex, dataEndIndex);

// Try to parse the data using a temporary file
console.log('Parsing data array...');
const tempFilePath = path.join(process.cwd(), 'temp-data-array.js');
fs.writeFileSync(tempFilePath, 'module.exports = [' + dataArrayString + '];');

// Require the temporary file
const dataArray = require('./temp-data-array.js');

// Delete the temporary file
fs.unlinkSync(tempFilePath);

// Analyze the chart groups and variable names
console.log('\nAnalyzing chart groups and variable names...');

// Count rows by chart group
const chartGroupCounts = {};
dataArray.forEach(row => {
  const group = row.chartGroup || (row.chartName || 'Unknown');
  if (!chartGroupCounts[group]) {
    chartGroupCounts[group] = {
      count: 0,
      variables: new Set()
    };
  }
  chartGroupCounts[group].count++;
  chartGroupCounts[group].variables.add(row.variableName);
});

// Expected chart groups and counts based on the architecture
const expectedChartGroups = {
  'Key Metrics': 7,
  'Site Distribution': 3,
  'Accounts': 36,
  'Customer Metrics': 36,
  'Historical Data': 24,
  'Inventory': 24,
  'POR Overview': 36,
  'Open Orders': 12,
  'Daily Orders': 7,
  'AR Aging': 5
};

// Print the results
console.log('\nCurrent Chart Groups:');
Object.keys(chartGroupCounts).sort().forEach(group => {
  console.log(`${group}: ${chartGroupCounts[group].count} rows, ${chartGroupCounts[group].variables.size} unique variables`);
  console.log(`  Variables: ${Array.from(chartGroupCounts[group].variables).join(', ')}`);
});

console.log('\nExpected Chart Groups:');
Object.keys(expectedChartGroups).sort().forEach(group => {
  console.log(`${group}: ${expectedChartGroups[group]} rows`);
  const actual = chartGroupCounts[group] ? chartGroupCounts[group].count : 0;
  if (actual !== expectedChartGroups[group]) {
    console.log(`  WARNING: Expected ${expectedChartGroups[group]} rows, but found ${actual}`);
  }
});

// Check for missing or extra chart groups
console.log('\nMissing Chart Groups:');
Object.keys(expectedChartGroups).forEach(group => {
  if (!chartGroupCounts[group]) {
    console.log(`  ${group}`);
  }
});

console.log('\nExtra Chart Groups:');
Object.keys(chartGroupCounts).forEach(group => {
  if (!expectedChartGroups[group]) {
    console.log(`  ${group}`);
  }
});
