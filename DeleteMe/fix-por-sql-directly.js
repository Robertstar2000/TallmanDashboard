/**
 * Script to directly fix POR SQL expressions in initial-data.ts
 * This script:
 * 1. Converts SQL Server syntax to MS Access/Jet SQL syntax for POR database
 * 2. Updates all POR Overview entries with proper MS Access syntax
 */

const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Create a backup of the current file
const backupPath = `${filePath}.backup-direct-fix-${Date.now()}`;
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Define the POR SQL expressions for different variables and months
const porSqlTemplates = {
  'New Rentals': {
    template: "SELECT Count(*) as value FROM Rentals WHERE Status = 'New' AND Month(CreatedDate) = {month} AND Year(CreatedDate) = Year(Date())"
  },
  'Open Rentals': {
    template: "SELECT Count(*) as value FROM Rentals WHERE Status = 'Open' AND Month(CreatedDate) = {month} AND Year(CreatedDate) = Year(Date())"
  },
  'Rental Value': {
    template: "SELECT Sum(Nz(RentalValue,0)) as value FROM Rentals WHERE Month(CreatedDate) = {month} AND Year(CreatedDate) = Year(Date())"
  }
};

// Define the AR Aging SQL expressions
const arAgingSqlTemplates = {
  'Current': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) <= 0",
  '1-30 Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 1 AND 30",
  '31-60 Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 31 AND 60",
  '61-90 Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) BETWEEN 61 AND 90",
  '90+ Days': "SELECT Sum(Nz(OpenAmount,0)) as value FROM AccountsReceivable WHERE DateDiff('d', DueDate, Date()) > 90"
};

// Map month names to their numeric values
const monthMap = {
  'January': 1,
  'February': 2,
  'March': 3,
  'April': 4,
  'May': 5,
  'June': 6,
  'July': 7,
  'August': 8,
  'September': 9,
  'October': 10,
  'November': 11,
  'December': 12
};

// Function to fix POR SQL expressions directly
function fixPorSqlExpressions() {
  // Fix POR Overview SQL expressions
  for (const [variableName, template] of Object.entries(porSqlTemplates)) {
    for (const [monthName, monthNumber] of Object.entries(monthMap)) {
      const sql = template.template.replace('{month}', monthNumber);
      
      // Create regex pattern to match the specific POR Overview entry
      const pattern = new RegExp(
        `(name:\\s*["']Por Overview \\d+["'][^}]*variableName:\\s*["']${variableName}["'][^}]*serverName:\\s*['"]POR['"][^}]*${monthName}[^}]*productionSqlExpression:\\s*["'])([^"']*)(['"])`,
        'i'
      );
      
      // Replace the SQL expression
      content = content.replace(pattern, `$1${sql}$3`);
    }
  }
  
  // Fix AR Aging SQL expressions
  for (const [agingBucket, sql] of Object.entries(arAgingSqlTemplates)) {
    // Create regex pattern to match the specific AR Aging entry
    const pattern = new RegExp(
      `(name:\\s*["']AR Aging[^}]*variableName:\\s*["']${agingBucket}["'][^}]*serverName:\\s*['"]POR['"][^}]*productionSqlExpression:\\s*["'])([^"']*)(['"])`,
      'i'
    );
    
    // Replace the SQL expression
    content = content.replace(pattern, `$1${sql}$3`);
  }
  
  // Fix any remaining POR SQL expressions with SQL Server syntax
  content = content.replace(
    /(serverName:\s*['"]POR['"][^}]*productionSqlExpression:\s*["'])([^"']*dbo\.[^"']*WITH\s*\(\s*NOLOCK\s*\)[^"']*)(['"])/g,
    (match, prefix, sql, suffix) => {
      // Remove SQL Server specific syntax
      const fixedSql = sql
        .replace(/dbo\./g, '')
        .replace(/WITH\s*\(\s*NOLOCK\s*\)/g, '')
        .replace(/GETDATE\(\)/g, 'Date()');
      
      return `${prefix}${fixedSql}${suffix}`;
    }
  );
  
  return content;
}

// Fix POR SQL expressions
const updatedContent = fixPorSqlExpressions();

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Fixed POR SQL expressions in initial-data.ts');

// Run a validation to check if there are still issues
function validatePorSql(content) {
  // Check for SQL Server syntax in POR expressions
  const porSqlServerSyntaxPattern = /serverName:\s*['"]POR['"][^}]*productionSqlExpression:\s*["']([^"']*(?:dbo\.|WITH\s*\(\s*NOLOCK\s*\)|GETDATE\(\)|DATEADD|DATEDIFF)[^"']*)["']/g;
  
  let match;
  let issues = [];
  
  while ((match = porSqlServerSyntaxPattern.exec(content)) !== null) {
    issues.push({
      sql: match[1],
      issue: 'POR expression still contains SQL Server syntax'
    });
  }
  
  return issues;
}

// Validate the updated content
const remainingIssues = validatePorSql(updatedContent);

// Display validation results
if (remainingIssues.length > 0) {
  console.log(`\nFound ${remainingIssues.length} remaining issues with POR SQL expressions:`);
  remainingIssues.forEach((issue, index) => {
    console.log(`\nIssue ${index + 1}:`);
    console.log(`SQL: ${issue.sql}`);
    console.log(`Issue: ${issue.issue}`);
  });
} else {
  console.log('\n✅ No issues found with POR SQL expressions');
}

// Run a final check for the Web Orders count
function countWebOrdersRows(content) {
  const webOrdersPattern = /chartGroup:\s*["']Web Orders["']/g;
  const matches = content.match(webOrdersPattern) || [];
  return matches.length;
}

const webOrdersCount = countWebOrdersRows(updatedContent);
console.log(`\nWeb Orders count: ${webOrdersCount}`);
if (webOrdersCount !== 12) {
  console.log(`⚠️ Web Orders count should be 12, but found ${webOrdersCount}`);
} else {
  console.log('✅ Web Orders count is correct (12)');
}
