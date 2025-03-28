const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file and backup directory
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
const backupDir = path.join(__dirname, 'lib', 'db');

// Create a new backup of the current (corrupted) file
const currentBackupPath = filePath + '.corrupted-backup-' + Date.now() + '.ts';
try {
  fs.copyFileSync(filePath, currentBackupPath);
  console.log(`Created backup of current corrupted file at ${currentBackupPath}`);
} catch (err) {
  console.error('Error creating backup of corrupted file:', err);
}

// Find the most recent backup file that doesn't have syntax issues
const backupFiles = fs.readdirSync(backupDir)
  .filter(file => file.startsWith('initial-data.ts.backup'))
  .map(file => path.join(backupDir, file))
  .filter(file => fs.statSync(file).isFile())
  .sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

console.log(`Found ${backupFiles.length} backup files`);

// Try to find a good backup file
let restoredContent = null;
let restoredFromFile = null;

for (const backupFile of backupFiles) {
  try {
    const content = fs.readFileSync(backupFile, 'utf8');
    
    // Check if the file has basic structure (contains SpreadsheetRow interface)
    if (content.includes('export interface SpreadsheetRow') && 
        content.includes('export const initialSpreadsheetData')) {
      restoredContent = content;
      restoredFromFile = backupFile;
      console.log(`Found valid backup file: ${backupFile}`);
      break;
    }
  } catch (err) {
    console.error(`Error reading backup file ${backupFile}:`, err);
  }
}

if (!restoredContent) {
  console.error('Could not find a valid backup file');
  process.exit(1);
}

// Fix common SQL syntax issues in the restored content
function fixSqlSyntax(content) {
  // Fix misplaced parentheses in COALESCE functions
  content = content.replace(/COALESCE\(SUM\([^)]+\)['"]/, 'COALESCE(SUM($&), ');
  
  // Fix single quotes inside SQL expressions
  content = content.replace(/(\w+) = '(\w+)'/g, '$1 = "$2"');
  
  // Fix missing commas after SQL expressions
  content = content.replace(/productionSqlExpression: (['"])(.+?)(['"])(\s*\n\s*tableName)/g, 
                           'productionSqlExpression: $1$2$3,$4');
  
  // Fix variableName issues for Site Distribution
  content = content.replace(/variableName: Columbus/g, 'variableName: "Columbus"');
  content = content.replace(/variableName: Addison/g, 'variableName: "Addison"');
  content = content.replace(/variableName: Lake City/g, 'variableName: "Lake City"');
  
  // Fix the specific issue with OPEN_AMT in the first row
  content = content.replace(
    /productionSqlExpression: 'SELECT COALESCE\(SUM\(OPEN_AMT\)'.+?0\) as value/g,
    "productionSqlExpression: 'SELECT COALESCE(SUM(OPEN_AMT), 0) as value"
  );
  
  return content;
}

// Fix SQL syntax issues
const fixedContent = fixSqlSyntax(restoredContent);

// Write the fixed content back to the file
fs.writeFileSync(filePath, fixedContent, 'utf8');
console.log(`Restored and fixed initial-data.ts from ${restoredFromFile}`);

// Delete the problematic fix-sql-syntax.js file if it exists
try {
  const fixSqlSyntaxPath = path.join(__dirname, 'fix-sql-syntax.js');
  if (fs.existsSync(fixSqlSyntaxPath)) {
    fs.unlinkSync(fixSqlSyntaxPath);
    console.log('Deleted problematic fix-sql-syntax.js file');
  }
} catch (err) {
  console.error('Error deleting fix-sql-syntax.js file:', err);
}
