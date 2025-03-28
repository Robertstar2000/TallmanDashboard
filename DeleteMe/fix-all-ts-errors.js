const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Fix all remaining SQL expressions with broken quotes in the Key Metrics section
// This is a common pattern where SQL expressions are malformed
const keyMetricsPattern = /productionSqlExpression: (`.*?`)(,|\s*})/g;
content = content.replace(keyMetricsPattern, (match, sqlExpr, ending) => {
  // Check if the SQL expression contains unmatched backticks or trailing content
  if (sqlExpr.split('`').length > 3) {
    // Extract the correct SQL expression between the first set of backticks
    const fixedSql = sqlExpr.substring(0, sqlExpr.lastIndexOf('`') + 1);
    return `productionSqlExpression: ${fixedSql}${ending}`;
  }
  return match;
});

// Fix 2: Fix specific issues with the Daily Revenue SQL expression
content = content.replace(/productionSqlExpression: `SELECT ISNULL\(SUM\(INVOICE_AMT\), 0\) as value FROM INVOICE_HDR WITH \(NOLOCK\) WHERE CONVERT\(date, INVOICE_DATE\) = CONVERT\(date, DATEADD\(day, -1, GETDATE\(\)\)\)`.+?tableName/gs, 
                         'productionSqlExpression: `SELECT ISNULL(SUM(INVOICE_AMT), 0) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE CONVERT(date, INVOICE_DATE) = CONVERT(date, DATEADD(day, -1, GETDATE()))`\n    tableName');

// Fix 3: Fix any remaining issues with the Open Invoices SQL expression
content = content.replace(/productionSqlExpression: `SELECT COUNT\(\*\) as value FROM INVOICE_HDR WITH \(NOLOCK\) WHERE OPEN_CLOSED_FLAG.+?tableName/gs,
                         'productionSqlExpression: `SELECT COUNT(*) as value FROM INVOICE_HDR WITH (NOLOCK) WHERE OPEN_CLOSED_FLAG = "O"`\n    tableName');

// Fix 4: Fix any remaining issues with the Orders Backlogged SQL expression
content = content.replace(/productionSqlExpression: `SELECT COUNT\(\*\) as value FROM OE_HDR WITH \(NOLOCK\) WHERE ORDER_STATUS.+?tableName/gs,
                         'productionSqlExpression: `SELECT COUNT(*) as value FROM OE_HDR WITH (NOLOCK) WHERE ORDER_STATUS = "B" AND DATEDIFF(day, ORDER_DATE, GETDATE()) <= 30`\n    tableName');

// Fix 5: Fix any remaining issues with the Total Monthly Sales SQL expression
content = content.replace(/productionSqlExpression: `SELECT ISNULL\(SUM\(EXTENDED_PRICE\), 0\) as value FROM OE_HDR h WITH \(NOLOCK\) JOIN OE_LINE l WITH \(NOLOCK\) ON.+?tableName/gs,
                         'productionSqlExpression: `SELECT ISNULL(SUM(EXTENDED_PRICE), 0) as value FROM OE_HDR h WITH (NOLOCK) JOIN OE_LINE l WITH (NOLOCK) ON h.ORDER_NO = l.ORDER_NO WHERE DATEDIFF(day, h.ORDER_DATE, GETDATE()) <= 30`\n    tableName');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed all TypeScript errors in initial-data.ts');

// Now let's create a function to validate the file for any remaining issues
const validateScript = `
const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Check for unmatched backticks in SQL expressions
const sqlExprPattern = /productionSqlExpression: (\`.*?\`)/g;
let match;
let errors = 0;

while ((match = sqlExprPattern.exec(content)) !== null) {
  const sqlExpr = match[1];
  const backtickCount = (sqlExpr.match(/\`/g) || []).length;
  
  if (backtickCount !== 2) {
    console.error(\`Unmatched backticks found in SQL expression: \${sqlExpr.substring(0, 50)}...\`);
    errors++;
  }
}

if (errors === 0) {
  console.log('No unmatched backticks found in SQL expressions');
} else {
  console.log(\`Found \${errors} SQL expressions with unmatched backticks\`);
}

// Check for any remaining 'Y' or 'N' in SQL expressions
const flagPattern = /WHERE.*?= '([YN])'/g;
let flagMatch;
let flagErrors = 0;

while ((flagMatch = flagPattern.exec(content)) !== null) {
  console.error(\`Found potential quote issue with flag: \${flagMatch[0]}\`);
  flagErrors++;
}

if (flagErrors === 0) {
  console.log('No flag quote issues found');
} else {
  console.log(\`Found \${flagErrors} potential flag quote issues\`);
}

// Check for any remaining '%Plumbing%' patterns
const plumbingPattern = /'%([A-Za-z]+)%'/g;
let plumbingMatch;
let plumbingErrors = 0;

while ((plumbingMatch = plumbingPattern.exec(content)) !== null) {
  console.error(\`Found potential quote issue with pattern: \${plumbingMatch[0]}\`);
  plumbingErrors++;
}

if (plumbingErrors === 0) {
  console.log('No pattern quote issues found');
} else {
  console.log(\`Found \${plumbingErrors} potential pattern quote issues\`);
}

console.log('Validation complete');
`;

// Write the validation script to a new file
fs.writeFileSync(path.join(__dirname, 'validate-sql-expressions.js'), validateScript, 'utf8');

console.log('Created validation script: validate-sql-expressions.js');
