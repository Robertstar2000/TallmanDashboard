const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Create a backup of the original file
const backupPath = filePath + '.backup-' + Date.now() + '.ts';
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`Created backup at ${backupPath}`);

// Function to fix a specific SQL expression
function fixSqlExpression(line) {
  // Check if the line contains a SQL expression
  if (line.includes('sqlExpression:') || line.includes('productionSqlExpression:')) {
    // Extract the SQL expression part
    const parts = line.split(/sqlExpression:|productionSqlExpression:/);
    const prefix = parts[0] + (line.includes('sqlExpression:') ? 'sqlExpression:' : 'productionSqlExpression:');
    let sqlPart = parts[1];
    
    // Check if the SQL expression is properly quoted
    const firstQuote = sqlPart.indexOf("'");
    const lastQuote = sqlPart.lastIndexOf("'");
    
    // If there's no closing quote or it's before the end, fix it
    if (firstQuote !== -1 && (lastQuote === firstQuote || lastQuote < sqlPart.length - 2)) {
      // Find where the SQL expression should end (before a comma or end of line)
      const commaPos = sqlPart.indexOf(',');
      if (commaPos !== -1) {
        // There's a comma, so the SQL should end before it
        sqlPart = "'" + sqlPart.substring(firstQuote + 1, commaPos).trim() + "',";
      } else {
        // No comma, assume it ends at the end of the line
        sqlPart = "'" + sqlPart.substring(firstQuote + 1).trim() + "'";
      }
      
      // Replace any single quotes inside the SQL with double quotes
      sqlPart = sqlPart.replace(/'([^']*)'(?=[^']*')/g, '"$1"');
      
      return prefix + ' ' + sqlPart;
    }
  }
  
  return line;
}

// Process the file line by line
const lines = content.split('\n');
const fixedLines = lines.map(fixSqlExpression);

// Join the lines back together
const fixedContent = fixedLines.join('\n');

// Additional fixes for common issues
let finalContent = fixedContent;

// Fix any ORDER_SOURCE = 'WEB' without double quotes
finalContent = finalContent.replace(/ORDER_SOURCE = 'WEB'/g, 'ORDER_SOURCE = "WEB"');

// Fix any missing commas after SQL expressions
finalContent = finalContent.replace(/productionSqlExpression: ('[^']*')(\s*\n\s*tableName)/g, 'productionSqlExpression: $1,$2');

// Fix the variableName issues for Site Distribution
finalContent = finalContent.replace(/variableName: Columbus/g, 'variableName: "Columbus"');
finalContent = finalContent.replace(/variableName: Addison/g, 'variableName: "Addison"');
finalContent = finalContent.replace(/variableName: Lake City/g, 'variableName: "Lake City"');

// Fix specific truncated SQL expressions
finalContent = finalContent.replace(/productionSqlExpression: 'SELECT COALESCE\(SUM\(QTY_ON_HAND\), 0\) as value[^']*?(?=\s*,|\s*\n)/g, 
                     "productionSqlExpression: 'SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN PRODUCT_LINE pl ON im.PROD_LINE = pl.PROD_LINE WHERE pl.DESCRIPTION LIKE \"%Plumbing%\"'");

finalContent = finalContent.replace(/productionSqlExpression: 'SELECT COALESCE\(SUM\(OPEN_AMT\)\)', 0\) as value/g, 
                     "productionSqlExpression: 'SELECT COALESCE(SUM(OPEN_AMT), 0) as value");

// Write the updated content back to the file
fs.writeFileSync(filePath, finalContent, 'utf8');

console.log('Fixed all SQL expressions in initial-data.ts');
