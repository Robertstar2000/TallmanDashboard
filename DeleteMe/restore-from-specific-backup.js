const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
const backupDir = path.join(__dirname, 'lib', 'db');

// Choose a specific backup file - using one of the earlier backups
const specificBackup = path.join(backupDir, 'initial-data.ts.backup-original-1742522173282');

// Create a new backup of the current (corrupted) file
const currentBackupPath = filePath + '.corrupted-' + Date.now() + '.ts';
try {
  fs.copyFileSync(filePath, currentBackupPath);
  console.log(`Created backup of current corrupted file at ${currentBackupPath}`);
} catch (err) {
  console.error('Error creating backup of corrupted file:', err);
}

// Check if the specific backup exists
if (!fs.existsSync(specificBackup)) {
  console.error(`Specific backup file ${specificBackup} not found`);
  
  // Try to find any backup file
  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('initial-data.ts.backup'))
    .map(file => path.join(backupDir, file));
  
  if (backupFiles.length > 0) {
    console.log(`Found ${backupFiles.length} backup files. Using the first one: ${backupFiles[0]}`);
    specificBackup = backupFiles[0];
  } else {
    console.error('No backup files found');
    process.exit(1);
  }
}

// Read the backup file
try {
  let restoredContent = fs.readFileSync(specificBackup, 'utf8');
  console.log(`Read content from backup file: ${specificBackup}`);
  
  // Fix common SQL syntax issues in the restored content
  function fixSqlSyntax(content) {
    // Fix misplaced parentheses in COALESCE functions
    content = content.replace(/COALESCE\(SUM\(([^)]+)\)\)('|")/g, 'COALESCE(SUM($1), 0)$2');
    
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
      /productionSqlExpression: ['"]SELECT COALESCE\(SUM\(OPEN_AMT\)\)['"], 0\) as value/g,
      "productionSqlExpression: 'SELECT COALESCE(SUM(OPEN_AMT), 0) as value"
    );
    
    return content;
  }
  
  // Fix SQL syntax issues
  const fixedContent = fixSqlSyntax(restoredContent);
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log(`Restored and fixed initial-data.ts from ${specificBackup}`);
  
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
} catch (err) {
  console.error(`Error restoring from backup file ${specificBackup}:`, err);
}
