/**
 * Script to verify all SQL expressions in initial-data.ts
 * This script:
 * 1. Checks that all SQL expressions are properly formatted
 * 2. Verifies that P21 expressions use SQL Server syntax
 * 3. Verifies that POR expressions use MS Access/Jet SQL syntax
 * 4. Ensures all chart groups have the correct SQL expressions
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-verify-${Date.now()}`;
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

// Define SQL syntax patterns for validation
const sqlPatterns = {
  p21: {
    dateAdd: /DATEADD\s*\(\s*(\w+)\s*,\s*(-?\d+|\?)\s*,\s*([^)]+)\)/i,
    dateDiff: /DATEDIFF\s*\(\s*(\w+)\s*,\s*([^,]+)\s*,\s*([^)]+)\)/i,
    getDate: /GETDATE\s*\(\s*\)/i,
    convert: /CONVERT\s*\(\s*(\w+)\s*,\s*([^)]+)\)/i,
    coalesce: /COALESCE\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/i,
    nolock: /WITH\s*\(\s*NOLOCK\s*\)/i,
    month: /MONTH\s*\(\s*([^)]+)\)/i,
    year: /YEAR\s*\(\s*([^)]+)\)/i
  },
  por: {
    dateAdd: /DateAdd\s*\(\s*['"](\w+)['"]\s*,\s*(-?\d+|\?)\s*,\s*([^)]+)\)/i,
    dateDiff: /DateDiff\s*\(\s*['"](\w+)['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\)/i,
    date: /Date\s*\(\s*\)/i,
    dateValue: /DateValue\s*\(\s*([^)]+)\)/i,
    nz: /Nz\s*\(\s*([^,]+)\s*,\s*([^)]+)\)/i,
    month: /Month\s*\(\s*([^)]+)\)/i,
    year: /Year\s*\(\s*([^)]+)\)/i
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
      if (!sqlPatterns.p21.dateAdd.test(productionSqlExpression) && 
          !sqlPatterns.p21.dateDiff.test(productionSqlExpression) && 
          !sqlPatterns.p21.getDate.test(productionSqlExpression) &&
          productionSqlExpression.includes('Date')) {
        issues.push({
          id,
          name,
          chartGroup,
          variableName,
          serverName,
          issue: 'P21 expression may be using incorrect date functions',
          sql: productionSqlExpression
        });
      }
      
      // Check for WITH (NOLOCK) hint
      if (productionSqlExpression.includes('FROM dbo.') && !sqlPatterns.p21.nolock.test(productionSqlExpression)) {
        issues.push({
          id,
          name,
          chartGroup,
          variableName,
          serverName,
          issue: 'P21 expression missing WITH (NOLOCK) hint',
          sql: productionSqlExpression
        });
      }
    } 
    else if (serverName === 'POR') {
      // Check for MS Access/Jet SQL syntax in POR expressions
      if (!sqlPatterns.por.dateAdd.test(productionSqlExpression) && 
          !sqlPatterns.por.dateDiff.test(productionSqlExpression) && 
          !sqlPatterns.por.date.test(productionSqlExpression) &&
          productionSqlExpression.includes('Date')) {
        issues.push({
          id,
          name,
          chartGroup,
          variableName,
          serverName,
          issue: 'POR expression may be using incorrect date functions',
          sql: productionSqlExpression
        });
      }
      
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

// Function to fix common SQL syntax issues
function fixSqlSyntaxIssues(dataSection) {
  // Fix P21 expressions
  dataSection = dataSection.replace(/productionSqlExpression:\s*["']([^"']*)(COALESCE\s*\(\s*SUM\s*\(\s*[^,)]+\s*\)\s*\))[^"']*["']/g, 
    (match, prefix, coalesce, suffix) => {
      return match.replace(coalesce, `COALESCE(SUM(OPEN_AMT), 0)`);
    }
  );
  
  // Fix POR expressions
  dataSection = dataSection.replace(/productionSqlExpression:\s*["']([^"']*)(DateDiff\s*\(\s*['"]d['"]\s*,[^,]+,[^)]+\))[^"']*["']/g, 
    (match, prefix, dateDiff) => {
      return match.replace(/DateDiff\s*\(\s*['"]d['"]\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, 
        `DateDiff('d', $1, $2)`);
    }
  );
  
  // Fix missing quotes in POR expressions
  dataSection = dataSection.replace(/productionSqlExpression:\s*["']([^"']*)(DateAdd\s*\(\s*d\s*,[^,]+,[^)]+\))[^"']*["']/g, 
    (match, prefix, dateAdd) => {
      return match.replace(/DateAdd\s*\(\s*d\s*,/g, `DateAdd('d',`);
    }
  );
  
  return dataSection;
}

// Validate SQL expressions
const issues = validateSqlExpressions(dataSection);

// Display validation results
if (issues.length > 0) {
  console.log(`Found ${issues.length} issues with SQL expressions:`);
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
  
  // Fix common SQL syntax issues
  const fixedDataSection = fixSqlSyntaxIssues(dataSection);
  
  if (fixedDataSection !== dataSection) {
    // Replace the data section in the content
    const updatedContent = content.substring(0, dataStartIndex) + fixedDataSection + content.substring(dataEndIndex);
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log('\nFixed common SQL syntax issues in initial-data.ts');
    
    // Validate again after fixes
    const remainingIssues = validateSqlExpressions(fixedDataSection);
    console.log(`\nRemaining issues after fixes: ${remainingIssues.length}`);
  }
} else {
  console.log('✅ No issues found with SQL expressions');
}

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
