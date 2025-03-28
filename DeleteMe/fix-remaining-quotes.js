const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix the remaining flag quote issue
content = content.replace(/WHERE COMPLETED = 'N'/g, 'WHERE COMPLETED = "N"');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed remaining quote issues in initial-data.ts');
