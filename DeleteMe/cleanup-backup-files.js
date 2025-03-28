const fs = require('fs');
const path = require('path');

// Path to the db directory
const dbDir = path.join(__dirname, 'lib', 'db');

// Get all files in the db directory
const files = fs.readdirSync(dbDir);

// Filter for backup files with .ts extension that are causing errors
const backupFiles = files.filter(file => 
  (file.includes('backup') || file.includes('corrupted')) && 
  file.endsWith('.ts') && 
  file !== 'initial-data.ts'
);

console.log(`Found ${backupFiles.length} backup files to delete`);

// Delete each backup file
let deletedCount = 0;
for (const file of backupFiles) {
  try {
    fs.unlinkSync(path.join(dbDir, file));
    console.log(`Deleted: ${file}`);
    deletedCount++;
  } catch (err) {
    console.error(`Error deleting ${file}:`, err);
  }
}

console.log(`Successfully deleted ${deletedCount} backup files`);

// Now let's check if the main initial-data.ts file is valid
try {
  const mainFile = path.join(dbDir, 'initial-data.ts');
  const content = fs.readFileSync(mainFile, 'utf8');
  
  // Check if the file has basic structure
  if (content.includes('export interface SpreadsheetRow') && 
      content.includes('export const initialSpreadsheetData')) {
    console.log('✅ initial-data.ts file has valid structure');
    
    // Count the number of rows for each chart group
    const chartGroups = {};
    const rows = content.match(/chartGroup: ['"]([^'"]+)['"]/g) || [];
    
    rows.forEach(match => {
      const chartGroup = match.match(/['"]([^'"]+)['"]/)[1];
      chartGroups[chartGroup] = (chartGroups[chartGroup] || 0) + 1;
    });
    
    console.log('\nChart group row counts:');
    Object.entries(chartGroups).forEach(([group, count]) => {
      console.log(`${group}: ${count} rows`);
    });
    
    // Check for any remaining SQL syntax issues
    const sqlIssues = content.match(/COALESCE\(SUM\([^)]+\)\)['"],/g) || [];
    if (sqlIssues.length > 0) {
      console.log(`\n⚠️ Found ${sqlIssues.length} potential SQL syntax issues`);
    } else {
      console.log('\n✅ No obvious SQL syntax issues found');
    }
  } else {
    console.error('❌ initial-data.ts file does not have valid structure');
  }
} catch (err) {
  console.error('Error checking initial-data.ts file:', err);
}
