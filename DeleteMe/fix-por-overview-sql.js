/**
 * Script to fix POR Overview SQL expressions in initial-data.ts
 * This script converts SQL Server syntax to MS Access/Jet SQL syntax for POR database
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-por-overview-fix-${Date.now()}`;
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

// Define MS Access/Jet SQL expressions for POR Overview
const porOverviewSqlExpressions = {
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
    january: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 1 AND Year(CreatedDate) = Year(Date())",
    february: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 2 AND Year(CreatedDate) = Year(Date())",
    march: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 3 AND Year(CreatedDate) = Year(Date())",
    april: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 4 AND Year(CreatedDate) = Year(Date())",
    may: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 5 AND Year(CreatedDate) = Year(Date())",
    june: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 6 AND Year(CreatedDate) = Year(Date())",
    july: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 7 AND Year(CreatedDate) = Year(Date())",
    august: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 8 AND Year(CreatedDate) = Year(Date())",
    september: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 9 AND Year(CreatedDate) = Year(Date())",
    october: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 10 AND Year(CreatedDate) = Year(Date())",
    november: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 11 AND Year(CreatedDate) = Year(Date())",
    december: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = 12 AND Year(CreatedDate) = Year(Date())"
  }
};

// Function to fix POR Overview SQL expressions
function fixPorOverviewSql(dataSection) {
  // Regular expression to match each row object in the array
  const rowRegex = /{\s*id:\s*['"]([^'"]+)['"]\s*,[\s\S]*?}/g;
  let match;
  let updatedDataSection = dataSection;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const variables = ['New Rentals', 'Open Rentals', 'Rental Value'];
  
  // Count of fixed expressions
  let fixedCount = 0;
  
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
    
    // Only process POR Overview rows
    if (serverName !== 'POR' || chartGroup !== 'POR Overview') continue;
    
    // Check if this is a POR Overview row with SQL Server syntax
    if (row.includes('dbo.por_items') || row.includes('WITH (NOLOCK)')) {
      // Determine which variable and month this row is for
      let matchedVariable = null;
      for (const variable of variables) {
        if (variableName.includes(variable)) {
          matchedVariable = variable;
          break;
        }
      }
      
      let matchedMonth = null;
      for (let i = 0; i < months.length; i++) {
        if (name.toLowerCase().includes(months[i].toLowerCase())) {
          matchedMonth = months[i].toLowerCase();
          break;
        }
      }
      
      // If we found a matching variable and month, update the SQL expression
      if (matchedVariable && matchedMonth && 
          porOverviewSqlExpressions[matchedVariable] && 
          porOverviewSqlExpressions[matchedVariable][matchedMonth]) {
        
        const newSql = porOverviewSqlExpressions[matchedVariable][matchedMonth];
        
        // Update the SQL expression in the row
        const updatedRow = row.replace(
          /productionSqlExpression:\s*["']([^"']*)["']/,
          `productionSqlExpression: "${newSql}"`
        );
        
        // Replace the old row with the updated row in the data section
        updatedDataSection = updatedDataSection.replace(row, updatedRow);
        fixedCount++;
      }
    }
  }
  
  console.log(`Fixed ${fixedCount} POR Overview SQL expressions`);
  return updatedDataSection;
}

// Fix POR Overview SQL expressions
const updatedDataSection = fixPorOverviewSql(dataSection);

// Replace the data section in the content
const updatedContent = content.substring(0, dataStartIndex) + updatedDataSection + content.substring(dataEndIndex);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Updated POR Overview SQL expressions in initial-data.ts');

// Run a validation to check if there are still issues
function validatePorSql(dataSection) {
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
    
    const serverNameMatch = row.match(/serverName:\s*['"]([^'"]+)['"]/);
    const serverName = serverNameMatch ? serverNameMatch[1] : 'unknown';
    
    const productionSqlExpressionMatch = row.match(/productionSqlExpression:\s*["']([^"']*)["']/);
    const productionSqlExpression = productionSqlExpressionMatch ? productionSqlExpressionMatch[1] : '';
    
    // Only check POR rows
    if (serverName !== 'POR') continue;
    
    // Check for SQL Server syntax in POR expressions
    if (productionSqlExpression.includes('dbo.') || 
        productionSqlExpression.includes('WITH (NOLOCK)') ||
        productionSqlExpression.includes('GETDATE()') ||
        productionSqlExpression.includes('DATEADD') ||
        productionSqlExpression.includes('DATEDIFF')) {
      issues.push({
        id,
        name,
        chartGroup,
        serverName,
        issue: 'POR expression still contains SQL Server syntax',
        sql: productionSqlExpression
      });
    }
  }
  
  return issues;
}

// Validate the updated data section
const remainingIssues = validatePorSql(updatedDataSection);

// Display validation results
if (remainingIssues.length > 0) {
  console.log(`\nFound ${remainingIssues.length} remaining issues with POR SQL expressions:`);
  remainingIssues.forEach((issue, index) => {
    console.log(`\nIssue ${index + 1}:`);
    console.log(`ID: ${issue.id}`);
    console.log(`Name: ${issue.name}`);
    console.log(`Chart Group: ${issue.chartGroup}`);
    console.log(`Server: ${issue.serverName}`);
    console.log(`Issue: ${issue.issue}`);
    console.log(`SQL: ${issue.sql}`);
  });
} else {
  console.log('\n✅ No issues found with POR SQL expressions');
}
