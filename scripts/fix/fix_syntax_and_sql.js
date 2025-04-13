const fs = require('fs');
const path = require('path');

// Part 1: Fix the syntax error in single-source-data.ts
console.log('\nFixing syntax error in single-source-data.ts...');
const singleDataFile = path.join(__dirname, 'lib', 'db', 'single-source-data.ts');

// Create backup
const backupFile = `${singleDataFile}.bak-node`;
fs.copyFileSync(singleDataFile, backupFile);
console.log(`Created backup at ${backupFile}`);

// Read file
let content = fs.readFileSync(singleDataFile, 'utf8');
const originalContent = content;

// Fix the specific syntax error (}; should be ];)
const errorPattern = /};[\s\n\r]*const group9Data/g;
if (errorPattern.test(content)) {
  content = content.replace(errorPattern, '];$&'.slice(2)); // Replace }; with ]; but keep the rest
  console.log('Fixed the syntax error in single-source-data.ts');
} else {
  console.log('Could not find the specific syntax error pattern');
}

// Part 2: Replace all sql references
console.log('\nReplacing sql references in single-source-data.ts...');

// Perform the replacements
let replacements = 0;
let newContent = content;

// Replace sql_expression with sql_expression
const regex1 = /sql_expression/g;
newContent = newContent.replace(regex1, 'sql_expression');
const count1 = (content.match(regex1) || []).length;
replacements += count1;

// Replace sql with sql_expression
const regex2 = /sql\b(?!_expression)/g; // Don't match if followed by _expression
newContent = newContent.replace(regex2, 'sql_expression');
const count2 = (content.match(regex2) || []).length;
replacements += count2;

// Replace camelCase variants
newContent = newContent.replace(/productionSqlExpression/g, 'sqlExpression');
newContent = newContent.replace(/productionSql\b(?!Expression)/g, 'sqlExpression');

// Write changes if necessary
if (newContent !== originalContent) {
  fs.writeFileSync(singleDataFile, newContent);
  console.log(`Updated single-source-data.ts with ${replacements} sql replacements`);
} else {
  console.log('No changes needed in single-source-data.ts');
}

console.log('\nScript completed. Please restart your development server to check if the issues are fixed.');
