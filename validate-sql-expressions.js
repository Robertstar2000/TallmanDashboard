
const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Check for unmatched backticks in SQL expressions
const sqlExprPattern = /productionSqlExpression: (`.*?`)/g;
let match;
let errors = 0;

while ((match = sqlExprPattern.exec(content)) !== null) {
  const sqlExpr = match[1];
  const backtickCount = (sqlExpr.match(/`/g) || []).length;
  
  if (backtickCount !== 2) {
    console.error(`Unmatched backticks found in SQL expression: ${sqlExpr.substring(0, 50)}...`);
    errors++;
  }
}

if (errors === 0) {
  console.log('No unmatched backticks found in SQL expressions');
} else {
  console.log(`Found ${errors} SQL expressions with unmatched backticks`);
}

// Check for any remaining 'Y' or 'N' in SQL expressions
const flagPattern = /WHERE.*?= '([YN])'/g;
let flagMatch;
let flagErrors = 0;

while ((flagMatch = flagPattern.exec(content)) !== null) {
  console.error(`Found potential quote issue with flag: ${flagMatch[0]}`);
  flagErrors++;
}

if (flagErrors === 0) {
  console.log('No flag quote issues found');
} else {
  console.log(`Found ${flagErrors} potential flag quote issues`);
}

// Check for any remaining '%Plumbing%' patterns
const plumbingPattern = /'%([A-Za-z]+)%'/g;
let plumbingMatch;
let plumbingErrors = 0;

while ((plumbingMatch = plumbingPattern.exec(content)) !== null) {
  console.error(`Found potential quote issue with pattern: ${plumbingMatch[0]}`);
  plumbingErrors++;
}

if (plumbingErrors === 0) {
  console.log('No pattern quote issues found');
} else {
  console.log(`Found ${plumbingErrors} potential pattern quote issues`);
}

console.log('Validation complete');
