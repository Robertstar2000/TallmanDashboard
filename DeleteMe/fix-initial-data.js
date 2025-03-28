const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix the missing opening brace issue
content = content.replace(/}\s*,\s*\n\s*id:/g, '},\n  {\n    id:');

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed initial-data.ts file');
