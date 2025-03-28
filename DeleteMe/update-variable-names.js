const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Replace {P21+POR} with (P21 plus POR) in variable names
let updatedContent = content.replace(/Total \{P21\+POR\}/g, 'Total (P21 plus POR)');

// Count the number of replacements made
const count = (content.match(/Total \{P21\+POR\}/g) || []).length;

// Write the updated content back to the file
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log(`Replaced ${count} instances of "Total {P21+POR}" with "Total (P21 plus POR)" in initial-data.ts file`);
