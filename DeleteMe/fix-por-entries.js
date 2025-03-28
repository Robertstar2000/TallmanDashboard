// Script to fix POR database entries (IDs 127-174) to use MS Access syntax
const fs = require('fs');
const path = require('path');

// File paths
const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-por-fix-${new Date().toISOString().replace(/:/g, '-')}`);

console.log('Starting POR entries fix script...');

// Create a backup
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');
console.log(`Read file content, size: ${fileContent.length} bytes`);

// Function to fix a POR SQL expression
function fixPorSqlExpression(sql) {
  if (!sql) return sql;
  
  // 1. Remove schema prefixes (dbo.)
  let fixed = sql.replace(/dbo\./g, '');
  
  // 2. Remove WITH (NOLOCK) hints
  fixed = fixed.replace(/\s+WITH\s+\(NOLOCK\)/gi, '');
  
  // 3. Replace GETDATE() with Date()
  fixed = fixed.replace(/GETDATE\(\)/gi, 'Date()');
  
  // 4. Replace DATEADD/DATEDIFF with DateAdd/DateDiff and add quotes around interval types
  fixed = fixed.replace(/DATEADD\(([a-z]+),/gi, "DateAdd('$1',");
  fixed = fixed.replace(/DATEDIFF\(([a-z]+),/gi, "DateDiff('$1',");
  
  // 5. Replace MONTH/YEAR functions with proper casing
  fixed = fixed.replace(/MONTH\(/gi, 'Month(');
  fixed = fixed.replace(/YEAR\(/gi, 'Year(');
  
  // 6. Replace COUNT with Count
  fixed = fixed.replace(/COUNT\(/gi, 'Count(');
  
  // 7. Replace SUM with Sum
  fixed = fixed.replace(/SUM\(/gi, 'Sum(');
  
  // 8. Ensure it has 'value' as the alias
  if (fixed.includes('SELECT') && !fixed.includes(' as value') && !fixed.includes(' AS value')) {
    fixed = fixed.replace(/SELECT\s+([^,]+)(\s+FROM)/i, 'SELECT $1 as value$2');
  }
  
  return fixed;
}

// Find and fix all POR entries (IDs 127-174)
let porEntryCount = 0;
let fixedEntryCount = 0;

// Use regex to find all entries
const entryRegex = /"id":\s*"(\d+)"[^}]*"productionSqlExpression":\s*"([^"]*)"/g;
let match;

while ((match = entryRegex.exec(fileContent)) !== null) {
  const id = parseInt(match[1], 10);
  const originalSql = match[2];
  
  // Check if this is a POR entry (ID between 127-174)
  if (id >= 127 && id <= 174) {
    porEntryCount++;
    
    // Fix the SQL expression
    const fixedSql = fixPorSqlExpression(originalSql);
    
    // Only replace if there's a change
    if (fixedSql !== originalSql) {
      fixedEntryCount++;
      console.log(`Fixed POR entry with ID ${id}`);
      
      // Replace the SQL expression in the file content
      fileContent = fileContent.replace(
        `"productionSqlExpression": "${originalSql}"`,
        `"productionSqlExpression": "${fixedSql}"`
      );
      
      // Also update the serverName to "POR" if it's not already
      const serverNameRegex = new RegExp(`"id":\\s*"${id}"[^}]*"serverName":\\s*"([^"]*)"`, 'g');
      const serverNameMatch = serverNameRegex.exec(fileContent);
      
      if (serverNameMatch && serverNameMatch[1] !== "POR") {
        fileContent = fileContent.replace(
          `"serverName": "${serverNameMatch[1]}"`,
          `"serverName": "POR"`
        );
        console.log(`Updated serverName for ID ${id} to "POR"`);
      }
    }
  }
}

console.log(`Found ${porEntryCount} POR entries, fixed ${fixedEntryCount} SQL expressions`);

// Write the updated content back to the file
fs.writeFileSync(filePath, fileContent);
console.log(`Updated file written to ${filePath}`);

console.log('POR entries fix script completed successfully!');
