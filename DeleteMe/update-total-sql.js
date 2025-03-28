const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Define the SQL expression for the Total (P21 plus POR) variable
const totalSqlExpression = "SELECT (SELECT COALESCE(SUM(INVOICE_AMT), 0) FROM INVOICE_HDR WHERE MONTH(INVOICE_DATE) = MONTH(GETDATE()) AND YEAR(INVOICE_DATE) = YEAR(GETDATE())) + (SELECT COALESCE(SUM(RENTAL_VALUE), 0) FROM RENTAL_ITEMS WHERE MONTH(RENTAL_DATE) = MONTH(GETDATE()) AND YEAR(RENTAL_DATE) = YEAR(GETDATE())) as value";

// Find all the Total (P21 plus POR) entries and update their SQL expressions
let updatedContent = content.replace(
  /variableName: ['"]Total \(P21 plus POR\)['"][\s\S]*?productionSqlExpression: [`'"].*?[`'"]/g,
  (match) => {
    return match.replace(
      /productionSqlExpression: [`'"].*?[`'"]/,
      `productionSqlExpression: "${totalSqlExpression}"`
    );
  }
);

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');

// Count the number of replacements made
const count = (updatedContent.match(/Total \(P21 plus POR\).*?productionSqlExpression: "SELECT \(SELECT COALESCE/g) || []).length;

console.log(`Updated ${count} Total (P21 plus POR) SQL expressions in initial-data.ts file`);
