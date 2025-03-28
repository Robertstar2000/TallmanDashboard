const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Define the SQL expression for the Total {P21+POR} variable
const totalSqlExpression = "SELECT (SELECT COALESCE(SUM(INVOICE_AMT), 0) FROM INVOICE_HDR WHERE MONTH(INVOICE_DATE) = MONTH(GETDATE()) AND YEAR(INVOICE_DATE) = YEAR(GETDATE())) + (SELECT COALESCE(SUM(RENTAL_VALUE), 0) FROM RENTAL_ITEMS WHERE MONTH(RENTAL_DATE) = MONTH(GETDATE()) AND YEAR(RENTAL_DATE) = YEAR(GETDATE())) as value";

// Regular expression to find the Total {P21+POR} variable entries
const regex = /chartGroup:\s*['"]Historical Data['"][\s\S]*?variableName:\s*['"]Total \{P21\+POR\}['"][\s\S]*?productionSqlExpression:\s*['"]\`?([^\`'"]*?)[\`'"]/g;

// Replace the SQL expressions for all Total {P21+POR} variables
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  const fullMatch = match[0];
  const currentSqlExpression = match[1];
  
  // Create the replacement string
  const replacement = fullMatch.replace(
    `productionSqlExpression: \`${currentSqlExpression}\``,
    `productionSqlExpression: "${totalSqlExpression}"`
  ).replace(
    `productionSqlExpression: "${currentSqlExpression}"`,
    `productionSqlExpression: "${totalSqlExpression}"`
  ).replace(
    `productionSqlExpression: '${currentSqlExpression}'`,
    `productionSqlExpression: "${totalSqlExpression}"`
  );
  
  // Replace in the content
  content = content.replace(fullMatch, replacement);
  count++;
}

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log(`Updated ${count} Total {P21+POR} SQL expressions in initial-data.ts file`);
