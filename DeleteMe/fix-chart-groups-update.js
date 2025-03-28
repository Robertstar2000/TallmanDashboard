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

// Define the expected chart groups and their variables
const chartGroupDefinitions = {
  'Key Metrics': [
    'Total Orders',
    'Open Orders',
    'Daily Revenue',
    'Open Invoices',
    'Orders Backlogged',
    'Total Sales Monthly',
    'Payable'
  ],
  'Site Distribution': [
    'Columbus',
    'Jackson',
    'Elk City'
  ],
  'Accounts': [
    'Payable',
    'Receivable',
    'Overdue'
  ],
  'Customer Metrics': [
    'New',
    'Active'
  ],
  'Historical Data': [
    'Orders',
    'Revenue'
  ],
  'Inventory': [
    'In Stock',
    'On Order'
  ],
  'POR Overview': [
    'New Rentals',
    'Open Rentals',
    'Rental Value'
  ],
  'Open Orders': [
    'Open Orders'
  ],
  'Daily Orders': [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ],
  'Web Orders': [
    'Orders',
    'Revenue'
  ],
  'AR Aging': [
    'Current',
    '1-30',
    '31-60',
    '61-90',
    '90+'
  ]
};

// Map variable names to chart groups
const variableToChartGroup = {};
Object.entries(chartGroupDefinitions).forEach(([chartGroup, variables]) => {
  variables.forEach(variable => {
    variableToChartGroup[variable.toLowerCase()] = chartGroup;
  });
});

// Helper function to determine chart group from variable name
function determineChartGroup(variableName) {
  if (!variableName) return 'Key Metrics';
  
  const lowerVar = variableName.toLowerCase();
  
  // Try exact match first
  if (variableToChartGroup[lowerVar]) {
    return variableToChartGroup[lowerVar];
  }
  
  // Try partial match
  for (const [variable, chartGroup] of Object.entries(variableToChartGroup)) {
    if (lowerVar.includes(variable)) {
      return chartGroup;
    }
  }
  
  // Special cases
  if (lowerVar.includes('order') && lowerVar.includes('web')) {
    return 'Web Orders';
  }
  if (lowerVar.includes('order') && lowerVar.includes('open')) {
    return 'Open Orders';
  }
  if (lowerVar.includes('order') && (lowerVar.includes('mon') || lowerVar.includes('tue') || lowerVar.includes('wed') || lowerVar.includes('thu') || lowerVar.includes('fri') || lowerVar.includes('sat') || lowerVar.includes('sun'))) {
    return 'Daily Orders';
  }
  if (lowerVar.includes('revenue') && lowerVar.includes('daily')) {
    return 'Key Metrics';
  }
  if (lowerVar.includes('sale') && lowerVar.includes('monthly')) {
    return 'Key Metrics';
  }
  if (lowerVar.includes('backlog')) {
    return 'Key Metrics';
  }
  if (lowerVar.includes('invoice')) {
    return 'Key Metrics';
  }
  if (lowerVar.includes('aging') || lowerVar.includes('day')) {
    return 'AR Aging';
  }
  if (lowerVar.includes('stock') || lowerVar.includes('inventory')) {
    return 'Inventory';
  }
  if (lowerVar.includes('rental') || lowerVar.includes('por')) {
    return 'POR Overview';
  }
  if (lowerVar.includes('site') || lowerVar.includes('columbus') || lowerVar.includes('jackson') || lowerVar.includes('elk')) {
    return 'Site Distribution';
  }
  if (lowerVar.includes('customer') || lowerVar.includes('new') || lowerVar.includes('active')) {
    return 'Customer Metrics';
  }
  if (lowerVar.includes('payable') || lowerVar.includes('receivable') || lowerVar.includes('overdue')) {
    return 'Accounts';
  }
  if (lowerVar.includes('historical') || (lowerVar.includes('order') && !lowerVar.includes('daily') && !lowerVar.includes('open'))) {
    return 'Historical Data';
  }
  
  // Default to Key Metrics if no match found
  return 'Key Metrics';
}

// Create month variables for monthly charts
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Define the expected rows for each chart group
const expectedRows = [];

// Key Metrics (7 datapoints)
chartGroupDefinitions['Key Metrics'].forEach(variable => {
  expectedRows.push({
    chartGroup: 'Key Metrics',
    variableName: variable
  });
});

// Site Distribution (3 datapoints)
chartGroupDefinitions['Site Distribution'].forEach(variable => {
  expectedRows.push({
    chartGroup: 'Site Distribution',
    variableName: variable
  });
});

// Accounts (3 variables × 12 months = 36 datapoints)
chartGroupDefinitions['Accounts'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'Accounts',
      variableName: variable,
      timeframe: month
    });
  });
});

// Customer Metrics (2 variables × 12 months = 36 datapoints)
chartGroupDefinitions['Customer Metrics'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'Customer Metrics',
      variableName: variable,
      timeframe: month
    });
  });
});

// Historical Data (2 variables × 12 months = 24 datapoints)
chartGroupDefinitions['Historical Data'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'Historical Data',
      variableName: variable,
      timeframe: month
    });
  });
});

// Inventory (2 variables × 12 months = 24 datapoints)
chartGroupDefinitions['Inventory'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'Inventory',
      variableName: variable,
      timeframe: month
    });
  });
});

// POR Overview (3 variables × 12 months = 36 datapoints)
chartGroupDefinitions['POR Overview'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'POR Overview',
      variableName: variable,
      timeframe: month
    });
  });
});

// Open Orders (1 variable × 12 months = 12 datapoints)
chartGroupDefinitions['Open Orders'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'Open Orders',
      variableName: variable,
      timeframe: month
    });
  });
});

// Web Orders (2 variables × 12 months = 24 datapoints)
chartGroupDefinitions['Web Orders'].forEach(variable => {
  months.forEach(month => {
    expectedRows.push({
      chartGroup: 'Web Orders',
      variableName: variable,
      timeframe: month
    });
  });
});

// Daily Orders (1 variable × 7 days = 7 datapoints)
chartGroupDefinitions['Daily Orders'].forEach((variable, index) => {
  expectedRows.push({
    chartGroup: 'Daily Orders',
    variableName: variable
  });
});

// AR Aging (5 datapoints)
chartGroupDefinitions['AR Aging'].forEach(variable => {
  expectedRows.push({
    chartGroup: 'AR Aging',
    variableName: variable
  });
});

// Update each item in the data array
console.log('Updating data array...');
const updatedDataArray = [...dataArray];

// First, update chart groups for existing rows
updatedDataArray.forEach(item => {
  // Ensure chartGroup is set based on variable name
  if (!item.chartGroup || item.chartGroup === 'Metrics') {
    item.chartGroup = determineChartGroup(item.variableName);
  }
});

// Check for missing rows and add them
console.log('Checking for missing rows...');
const existingRows = new Set();

// Create a key for each existing row
updatedDataArray.forEach(item => {
  const key = `${item.chartGroup}|${item.variableName}|${item.timeframe || ''}`;
  existingRows.add(key);
});

// Add missing rows
let nextId = Math.max(...updatedDataArray.map(item => parseInt(item.id))) + 1;
expectedRows.forEach(expected => {
  const key = `${expected.chartGroup}|${expected.variableName}|${expected.timeframe || ''}`;
  if (!existingRows.has(key)) {
    console.log(`Adding missing row: ${key}`);
    
    // Create a new row with default values
    const newRow = {
      id: nextId.toString(),
      name: expected.timeframe 
        ? `${expected.chartGroup} - ${expected.variableName} - ${expected.timeframe}` 
        : `${expected.chartGroup} - ${expected.variableName}`,
      chartGroup: expected.chartGroup,
      variableName: expected.variableName,
      serverName: 'P21',
      value: '0',
      calculation: '',
      sqlExpression: `SELECT 0 /* Default SQL for ${expected.chartGroup} - ${expected.variableName} */`,
      productionSqlExpression: `SELECT 0 /* Default SQL for ${expected.chartGroup} - ${expected.variableName} */`,
      tableName: '',
      timeframe: expected.timeframe || '',
      lastUpdated: new Date().toISOString()
    };
    
    updatedDataArray.push(newRow);
    nextId++;
  }
});

// Convert the updated array back to a string with proper formatting
console.log('Converting updated array back to string...');
const updatedDataArrayString = JSON.stringify(updatedDataArray, null, 2)
  .slice(1, -1) // Remove the outer brackets
  .replace(/^  /gm, '  '); // Maintain indentation

// Replace the original data array in the content
const updatedContent = content.substring(0, dataStartIndex) + 
                      updatedDataArrayString + 
                      content.substring(dataEndIndex);

// Write the updated content back to the file
console.log('Writing updated content back to initial-data.ts...');
fs.writeFileSync(filePath, updatedContent);

// Print summary of chart groups
console.log('\nSummary of updated chart groups:');
const chartGroupCounts = {};
updatedDataArray.forEach(row => {
  if (!chartGroupCounts[row.chartGroup]) {
    chartGroupCounts[row.chartGroup] = 0;
  }
  chartGroupCounts[row.chartGroup]++;
});

Object.keys(chartGroupCounts).sort().forEach(group => {
  console.log(`${group}: ${chartGroupCounts[group]} rows`);
});

console.log('\nSuccessfully updated chart groups in initial-data.ts');
