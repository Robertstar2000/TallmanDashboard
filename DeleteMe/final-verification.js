/**
 * Final verification script for initial-data.ts
 * This script:
 * 1. Verifies all chart groups have the correct number of rows
 * 2. Validates SQL expressions for both P21 and POR databases
 * 3. Checks for any remaining syntax issues
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

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

// Define SQL syntax patterns for validation
const sqlPatterns = {
  p21: {
    dateAdd: /DATEADD\s*\(\s*(\w+)\s*,\s*(-?\d+|\?)\s*,\s*([^)]+)\)/i,
    dateDiff: /DATEDIFF\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/i,
    getDate: /GETDATE\s*\(\s*\)/i,
    convert: /CONVERT\s*\(\s*(\w+)\s*,\s*([^)]+)\)/i,
    coalesce: /COALESCE\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/i,
    nolock: /WITH\s*\(\s*NOLOCK\s*\)/i
  },
  por: {
    dateAdd: /DateAdd\s*\(\s*['"](\w+)['"]\s*,\s*(-?\d+|\?)\s*,\s*([^)]+)\)/i,
    dateDiff: /DateDiff\s*\(\s*['"](\w+)['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\)/i,
    date: /Date\s*\(\s*\)/i,
    dateValue: /DateValue\s*\(\s*([^)]+)\)/i,
    nz: /Nz\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/i
  }
};

// Function to validate SQL expressions
function validateSqlExpressions(dataSection) {
  // Regular expression to match each row object in the array
  const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,[\s\S]*?}/g;
  let match;
  let issues = [];
  
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
    
    const sqlExpressionMatch = row.match(/sqlExpression:\s*["']([^"']*)["']/);
    const sqlExpression = sqlExpressionMatch ? sqlExpressionMatch[1] : '';
    
    const productionSqlExpressionMatch = row.match(/productionSqlExpression:\s*["']([^"']*)["']/);
    const productionSqlExpression = productionSqlExpressionMatch ? productionSqlExpressionMatch[1] : '';
    
    // Skip rows with empty SQL expressions (they might be placeholders)
    if (!productionSqlExpression) continue;
    
    // Validate SQL expressions based on server name
    if (serverName === 'P21') {
      // Check for SQL Server syntax in P21 expressions
      if (productionSqlExpression.includes('DateAdd(') || 
          productionSqlExpression.includes('DateDiff(') || 
          productionSqlExpression.includes('Date()') ||
          productionSqlExpression.includes('Nz(')) {
        issues.push({
          id,
          name,
          chartGroup,
          variableName,
          serverName,
          issue: 'P21 expression contains MS Access syntax',
          sql: productionSqlExpression
        });
      }
    } 
    else if (serverName === 'POR') {
      // Check for MS SQL Server specific syntax in POR expressions
      if (productionSqlExpression.includes('GETDATE()') || 
          productionSqlExpression.includes('DATEADD') || 
          productionSqlExpression.includes('DATEDIFF') ||
          productionSqlExpression.includes('WITH (NOLOCK)') ||
          productionSqlExpression.includes('dbo.')) {
        issues.push({
          id,
          name,
          chartGroup,
          variableName,
          serverName,
          issue: 'POR expression contains SQL Server specific syntax',
          sql: productionSqlExpression
        });
      }
    }
    
    // Check for common SQL syntax issues
    if (productionSqlExpression.includes("''") || productionSqlExpression.includes('""')) {
      issues.push({
        id,
        name,
        chartGroup,
        variableName,
        serverName,
        issue: 'SQL expression contains empty quotes',
        sql: productionSqlExpression
      });
    }
    
    if (productionSqlExpression.includes("'") && productionSqlExpression.includes('"') && 
        !productionSqlExpression.includes("'\"") && !productionSqlExpression.includes("\"'")) {
      issues.push({
        id,
        name,
        chartGroup,
        variableName,
        serverName,
        issue: 'SQL expression mixes single and double quotes',
        sql: productionSqlExpression
      });
    }
    
    // Check for unmatched parentheses
    const openParenCount = (productionSqlExpression.match(/\(/g) || []).length;
    const closeParenCount = (productionSqlExpression.match(/\)/g) || []).length;
    if (openParenCount !== closeParenCount) {
      issues.push({
        id,
        name,
        chartGroup,
        variableName,
        serverName,
        issue: `Unmatched parentheses (${openParenCount} open, ${closeParenCount} close)`,
        sql: productionSqlExpression
      });
    }
  }
  
  return issues;
}

// Count current rows for each chart group
const currentCounts = countChartGroupRows(dataSection);
console.log('Current chart group counts:');
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

// Validate SQL expressions
const issues = validateSqlExpressions(dataSection);

// Display validation results
if (issues.length > 0) {
  console.log(`\nFound ${issues.length} issues with SQL expressions:`);
  issues.forEach((issue, index) => {
    console.log(`\nIssue ${index + 1}:`);
    console.log(`ID: ${issue.id}`);
    console.log(`Name: ${issue.name}`);
    console.log(`Chart Group: ${issue.chartGroup}`);
    console.log(`Variable: ${issue.variableName}`);
    console.log(`Server: ${issue.serverName}`);
    console.log(`Issue: ${issue.issue}`);
    console.log(`SQL: ${issue.sql}`);
  });
} else {
  console.log('\n✅ No issues found with SQL expressions');
}

// Count the total number of rows
const totalRows = Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
console.log(`\nTotal rows: ${totalRows}`);
console.log(`Expected total rows: 174`);
console.log(`${totalRows === 174 ? '✅' : '⚠️'} ${totalRows === 174 ? 'Correct' : 'Incorrect'} total number of rows`);
