const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Find the problematic line around line 1958
const lines = content.split('\n');
let lineIndex = -1;

// Look for the truncated SQL expression
for (let i = 1950; i < 1970; i++) {
  if (lines[i] && lines[i].includes('sqlExpression: \'SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value')) {
    lineIndex = i;
    break;
  }
}

if (lineIndex !== -1) {
  // Replace the truncated SQL with a corrected version
  lines[lineIndex] = '    sqlExpression: \'SELECT COALESCE(SUM(QTY_ON_HAND), 0) as value FROM INV_MAST im JOIN PRODUCT_LINE pl ON im.PROD_LINE = pl.PROD_LINE WHERE pl.DESCRIPTION LIKE "%Plumbing%"\',';
  
  // Join the lines back together
  content = lines.join('\n');
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('Fixed truncated SQL expression at line', lineIndex + 1);
} else {
  console.log('Could not find the truncated SQL expression');
}

// Check for any other truncated SQL expressions
const truncatedPattern = /sqlExpression: ['"`].*?(?<!['"`])(?=\s*,|\s*\n)/g;
const matches = content.match(truncatedPattern);

if (matches && matches.length > 0) {
  console.log(`Found ${matches.length} potentially truncated SQL expressions`);
  
  // Fix all potentially truncated SQL expressions by adding a closing quote
  content = content.replace(truncatedPattern, (match) => match + "'");
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log('Fixed all potentially truncated SQL expressions');
} else {
  console.log('No other truncated SQL expressions found');
}

// Check for any ORDER_SOURCE = 'WEB' without double quotes
content = content.replace(/ORDER_SOURCE = 'WEB'/g, 'ORDER_SOURCE = "WEB"');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed WEB quotes in SQL expressions');

