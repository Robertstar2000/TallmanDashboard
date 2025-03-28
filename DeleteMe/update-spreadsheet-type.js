const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');

// Read the current content
console.log('Reading initial-data.ts file...');
let content = fs.readFileSync(filePath, 'utf8');

// Update the SpreadsheetRow type definition
console.log('Updating SpreadsheetRow type definition...');
const newTypeDefinition = `export type SpreadsheetRow = {
  id: string;
  name: string;
  chartGroup: string;
  variableName: string;
  serverName: string;
  value: string;
  calculation: string;
  sqlExpression: string;
  productionSqlExpression: string;
  tableName: string;
  timeframe?: string;
  lastUpdated?: string;
};`;

// Use regex to find and replace the type definition
const typeRegex = /export type SpreadsheetRow = \{[\s\S]*?\};/;
content = content.replace(typeRegex, newTypeDefinition);

// Write the updated content back to the file
console.log('Writing updated content back to initial-data.ts...');
fs.writeFileSync(filePath, content);

console.log('Successfully updated SpreadsheetRow type in initial-data.ts');
