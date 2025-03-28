const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
const sqliteFilePath = path.join(__dirname, 'lib', 'db', 'sqlite.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix the Site Distribution section errors (Columbus, Addison, Lake City)
// The issue is that 'Columbus', 'Addison', 'Lake City' are being treated as properties
// instead of strings in the variableName field
content = content.replace(/variableName: Columbus/g, 'variableName: "Columbus"');
content = content.replace(/variableName: Addison/g, 'variableName: "Addison"');
content = content.replace(/variableName: Lake City/g, 'variableName: "Lake City"');

// 2. Fix the Web Orders section errors (WEB)
// The issue is that 'WEB' is being treated as a property instead of a string
content = content.replace(/ORDER_SOURCE = WEB/g, 'ORDER_SOURCE = "WEB"');

// 3. Fix missing commas after productionSqlExpression in the Key Metrics section
content = content.replace(/productionSqlExpression: (`.*?`)(\s*\n\s*tableName)/g, 'productionSqlExpression: $1,$2');

// 4. Fix the issues with the serverConfigs section
// Make sure the host property is properly formatted
content = content.replace(/host: (.*?),/g, 'host: "$1",');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed remaining TypeScript errors in initial-data.ts');

// Now fix the server_name to serverName issues in sqlite.ts
if (fs.existsSync(sqliteFilePath)) {
  let sqliteContent = fs.readFileSync(sqliteFilePath, 'utf8');
  
  // Replace server_name with serverName
  sqliteContent = sqliteContent.replace(/server_name/g, 'serverName');
  
  // Replace config with appropriate properties
  sqliteContent = sqliteContent.replace(/config\./g, '');
  
  // Write the updated content back to the file
  fs.writeFileSync(sqliteFilePath, sqliteContent, 'utf8');
  
  console.log('Fixed TypeScript errors in sqlite.ts');
}

// Delete the problematic fix-sql-syntax.js file
try {
  const fixSqlSyntaxPath = path.join(__dirname, 'fix-sql-syntax.js');
  if (fs.existsSync(fixSqlSyntaxPath)) {
    fs.unlinkSync(fixSqlSyntaxPath);
    console.log('Deleted problematic fix-sql-syntax.js file');
  }
} catch (err) {
  console.error('Error deleting fix-sql-syntax.js file:', err);
}
