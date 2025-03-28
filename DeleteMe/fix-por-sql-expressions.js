/**
 * Script to fix POR SQL expressions in initial-data.ts
 * This script:
 * 1. Converts SQL Server syntax to MS Access/Jet SQL syntax for POR database
 * 2. Fixes case sensitivity issues with chart group names
 * 3. Ensures Web Orders count is correct (12 instead of 24)
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-por-fix-${Date.now()}`;
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

// Define MS Access/Jet SQL expressions for POR database
const porSqlExpressions = {
  'POR Overview': {
    'New Rentals': {
      january: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())",
      february: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())",
      march: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())",
      april: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 4 AND Year(CreatedDate) = Year(Date())",
      may: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 5 AND Year(CreatedDate) = Year(Date())",
      june: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 6 AND Year(CreatedDate) = Year(Date())",
      july: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 7 AND Year(CreatedDate) = Year(Date())",
      august: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 8 AND Year(CreatedDate) = Year(Date())",
      september: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 9 AND Year(CreatedDate) = Year(Date())",
      october: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 10 AND Year(CreatedDate) = Year(Date())",
      november: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 11 AND Year(CreatedDate) = Year(Date())",
      december: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = 12 AND Year(CreatedDate) = Year(Date())"
    },
    'Open Rentals': {
      january: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())",
      february: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())",
      march: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())",
      april: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 4 AND Year(CreatedDate) = Year(Date())",
      may: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 5 AND Year(CreatedDate) = Year(Date())",
      june: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 6 AND Year(CreatedDate) = Year(Date())",
      july: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 7 AND Year(CreatedDate) = Year(Date())",
      august: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 8 AND Year(CreatedDate) = Year(Date())",
      september: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 9 AND Year(CreatedDate) = Year(Date())",
      october: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 10 AND Year(CreatedDate) = Year(Date())",
      november: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 11 AND Year(CreatedDate) = Year(Date())",
      december: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = 12 AND Year(CreatedDate) = Year(Date())"
    },
    'Rental Value': {
      january: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())",
      february: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())",
      march: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())",
      april: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 4 AND Year(CreatedDate) = Year(Date())",
      may: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 5 AND Year(CreatedDate) = Year(Date())",
      june: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 6 AND Year(CreatedDate) = Year(Date())",
      july: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 7 AND Year(CreatedDate) = Year(Date())",
      august: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 8 AND Year(CreatedDate) = Year(Date())",
      september: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 9 AND Year(CreatedDate) = Year(Date())",
      october: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 10 AND Year(CreatedDate) = Year(Date())",
      november: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 11 AND Year(CreatedDate) = Year(Date())",
      december: "SELECT Sum(RentalValue) as value FROM Rentals WHERE Month(CreatedDate) = 12 AND Year(CreatedDate) = Year(Date())"
    }
  },
  'AR Aging': {
    'Current': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) <= 0",
    '1-30 Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 1 AND 30",
    '31-60 Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 31 AND 60",
    '61-90 Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 61 AND 90",
    '90+ Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) > 90"
  }
};

// Fix case sensitivity issues in chart group names
function fixChartGroupNames(dataSection) {
  // Map of lowercase chart group names to their correct case
  const chartGroupCaseMap = {
    'key metrics': 'Key Metrics',
    'site distribution': 'Site Distribution',
    'accounts': 'Accounts',
    'customer metrics': 'Customer Metrics',
    'historical data': 'Historical Data',
    'inventory': 'Inventory',
    'por overview': 'POR Overview',
    'daily orders': 'Daily Orders',
    'web orders': 'Web Orders',
    'ar aging': 'AR Aging'
  };
  
  // Fix chart group names
  Object.entries(chartGroupCaseMap).forEach(([lowercase, correct]) => {
    const regex = new RegExp(`chartGroup:\\s*["']${lowercase}["']`, 'gi');
    dataSection = dataSection.replace(regex, `chartGroup: "${correct}"`);
    
    // Also fix chartName
    const chartNameRegex = new RegExp(`chartName:\\s*["']${lowercase}["']`, 'gi');
    dataSection = dataSection.replace(chartNameRegex, `chartName: "${correct}"`);
  });
  
  return dataSection;
}

// Fix POR SQL expressions
function fixPorSqlExpressions(dataSection) {
  // Regular expression to match each row object in the array
  const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,[\s\S]*?}/g;
  let match;
  let updatedDataSection = dataSection;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  while ((match = rowRegex.exec(dataSection)) !== null) {
    const row = match[0];
    
    // Extract row information
    const idMatch = row.match(/id:\s*['"]([^'"]+)['"]/);
    const id = idMatch ? idMatch[1] : 'unknown';
    
    const nameMatch = row.match(/name:\s*["']([^"']+)["']/);
    const name = nameMatch ? nameMatch[1] : 'unknown';
    
    const chartGroupMatch = row.match(/chartGroup:\s*["']([^"']+)["']/);
    const chartGroup = chartGroupMatch ? chartGroupMatch[1] : 'unknown';
    
    const variableNameMatch = row.match(/variableName:\s*["']([^"']+)["']/);
    const variableName = variableNameMatch ? variableNameMatch[1] : 'unknown';
    
    const serverNameMatch = row.match(/serverName:\s*['"]([^'"]+)['"]/);
    const serverName = serverNameMatch ? serverNameMatch[1] : 'unknown';
    
    // Only process POR rows
    if (serverName !== 'POR') continue;
    
    // Fix POR Overview SQL expressions
    if (chartGroup.toLowerCase() === 'por overview') {
      // Determine which month this row is for
      let monthIndex = -1;
      for (let i = 0; i < months.length; i++) {
        if (name.includes(months[i])) {
          monthIndex = i;
          break;
        }
      }
      
      if (monthIndex !== -1) {
        const monthName = months[monthIndex].toLowerCase();
        
        // Get the correct SQL expression for this variable and month
        if (porSqlExpressions['POR Overview'][variableName] && 
            porSqlExpressions['POR Overview'][variableName][monthName]) {
          
          const newSql = porSqlExpressions['POR Overview'][variableName][monthName];
          
          // Update the SQL expression in the row
          const updatedRow = row.replace(
            /productionSqlExpression:\s*["']([^"']*)["']/,
            `productionSqlExpression: "${newSql}"`
          );
          
          // Replace the old row with the updated row
          updatedDataSection = updatedDataSection.replace(row, updatedRow);
        }
      }
    }
    // Fix AR Aging SQL expressions
    else if (chartGroup.toLowerCase() === 'ar aging') {
      if (porSqlExpressions['AR Aging'][variableName]) {
        const newSql = porSqlExpressions['AR Aging'][variableName];
        
        // Update the SQL expression in the row
        const updatedRow = row.replace(
          /productionSqlExpression:\s*["']([^"']*)["']/,
          `productionSqlExpression: "${newSql}"`
        );
        
        // Replace the old row with the updated row
        updatedDataSection = updatedDataSection.replace(row, updatedRow);
      }
    }
  }
  
  return updatedDataSection;
}

// Fix Web Orders count (should be 12, not 24)
function fixWebOrdersCount(dataSection) {
  // Count current Web Orders rows
  const webOrdersRows = (dataSection.match(/chartGroup:\s*["']Web Orders["']/g) || []).length;
  
  if (webOrdersRows > 12) {
    console.log(`Fixing Web Orders count: ${webOrdersRows} -> 12`);
    
    // Extract all rows
    const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,[\s\S]*?}/g;
    const rows = [];
    let match;
    
    while ((match = rowRegex.exec(dataSection)) !== null) {
      const row = match[0];
      const chartGroupMatch = row.match(/chartGroup:\s*["']([^"']+)["']/);
      const chartGroup = chartGroupMatch ? chartGroupMatch[1] : '';
      
      if (chartGroup.toLowerCase() === 'web orders') {
        const variableNameMatch = row.match(/variableName:\s*["']([^"']+)["']/);
        const variableName = variableNameMatch ? variableNameMatch[1] : '';
        
        // Keep only the first occurrence of each month
        if (!rows.some(r => r.chartGroup === 'Web Orders' && r.variableName === variableName)) {
          rows.push({ row, chartGroup, variableName });
        }
      } else {
        rows.push({ row, chartGroup });
      }
    }
    
    // Rebuild the data section with only the first 12 Web Orders rows
    let newDataSection = dataSection.substring(0, dataSection.indexOf('[') + 1);
    rows.forEach((row, index) => {
      newDataSection += row.row;
      if (index < rows.length - 1) {
        newDataSection += ',\n';
      }
    });
    newDataSection += '\n];\n';
    
    return newDataSection;
  }
  
  return dataSection;
}

// Fix chart group names
dataSection = fixChartGroupNames(dataSection);

// Fix POR SQL expressions
dataSection = fixPorSqlExpressions(dataSection);

// Fix Web Orders count
dataSection = fixWebOrdersCount(dataSection);

// Replace the data section in the content
const updatedContent = content.substring(0, dataStartIndex) + dataSection + content.substring(dataEndIndex);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Fixed POR SQL expressions in initial-data.ts');

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
const currentCounts = countChartGroupRows(dataSection);
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
