import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the source data file
const sourceFile = path.join(__dirname, '..', 'lib', 'db', 'single-source-data.ts');
let content = fs.readFileSync(sourceFile, 'utf8');

// Find all objects in the array and update their rowIds
let currentId = 1;
const updatedContent = content.replace(/{\s*"rowId":\s*"[^"]+"/g, (match) => {
    return `{"rowId": "${currentId++}"`;
});

// Write the updated content back to the file
fs.writeFileSync(sourceFile, updatedContent, 'utf8');

console.log(`Updated ${currentId - 1} rowIds in sequence`);
