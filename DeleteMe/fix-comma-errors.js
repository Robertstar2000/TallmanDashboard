const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const filePath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing commas after tableName properties in the Key Metrics section
// This pattern looks for tableName: '' followed by a closing brace without a comma
content = content.replace(/tableName: ''(\s*)\}/g, 'tableName: \'\'\,$1}');

// Fix any truncated SQL expressions
const truncatedSqlPattern = /(productionSqlExpression: '[^']*?)(?=\s*,\s*tableName:|$)/g;
content = content.replace(truncatedSqlPattern, (match, sqlPart) => {
  // If the SQL expression doesn't end with a quote, add one
  if (!sqlPart.endsWith("'")) {
    return sqlPart + "'";
  }
  return match;
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fixed comma errors in initial-data.ts');

// Delete the backup file that's causing errors
try {
  const backupFile = path.join(__dirname, 'lib', 'db', 'initial-data.ts.backup-1742646483799.ts');
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
    console.log('Deleted backup file that was causing errors');
  }
} catch (err) {
  console.error('Error deleting backup file:', err);
}
