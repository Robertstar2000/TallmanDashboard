// Script to safely fix SQL expressions in complete-chart-data.ts file
const fs = require('fs');
const path = require('path');

// File paths
const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-${new Date().toISOString().replace(/:/g, '-')}`);
const logPath = path.join(__dirname, 'fix-sql-expressions-safe.log');

// Start logging
const log = fs.createWriteStream(logPath, { flags: 'a' });
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}`;
  console.log(logLine);
  log.write(logLine + '\n');
};

logMessage('Starting SQL expression fix script');

// Create a backup of the file
try {
  fs.copyFileSync(filePath, backupPath);
  logMessage(`Created backup at ${backupPath}`);
} catch (error) {
  logMessage(`Error creating backup: ${error.message}`);
  process.exit(1);
}

// Read the file content
let fileContent;
try {
  fileContent = fs.readFileSync(filePath, 'utf8');
  logMessage(`Read file content, size: ${fileContent.length} bytes`);
} catch (error) {
  logMessage(`Error reading file: ${error.message}`);
  process.exit(1);
}

// Extract the data array from the file
const startMarker = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
const endMarker = '];';
const startIndex = fileContent.indexOf(startMarker);
const endIndex = fileContent.lastIndexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  logMessage('Could not find the data array markers in the file');
  process.exit(1);
}

// Extract the array content
const beforeArray = fileContent.substring(0, startIndex + startMarker.length);
const arrayContent = fileContent.substring(startIndex + startMarker.length, endIndex);
const afterArray = fileContent.substring(endIndex);

logMessage(`Extracted array content, size: ${arrayContent.length} bytes`);

// Parse the array content into individual objects
const objects = [];
let currentObject = '';
let braceCount = 0;
let inString = false;
let escapeNext = false;

for (let i = 0; i < arrayContent.length; i++) {
  const char = arrayContent[i];
  
  // Handle string literals and escaping
  if (char === '"' && !escapeNext) {
    inString = !inString;
  }
  
  // Handle escape character
  if (char === '\\' && !escapeNext) {
    escapeNext = true;
  } else {
    escapeNext = false;
  }
  
  // Only count braces when not in a string
  if (!inString) {
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
  }
  
  currentObject += char;
  
  // When we've completed an object, add it to our array
  if (braceCount === 0 && currentObject.trim() && currentObject.trim().endsWith('}')) {
    objects.push(currentObject.trim());
    currentObject = '';
  }
}

logMessage(`Found ${objects.length} objects in the data array`);

// Function to fix P21 SQL expressions (SQL Server)
function fixP21SqlExpression(sql) {
  if (!sql) return sql;
  
  // Ensure it has the correct schema prefix
  let fixed = sql;
  
  // Ensure it has WITH (NOLOCK) hints
  if (fixed.includes('FROM') && !fixed.includes('WITH (NOLOCK)')) {
    fixed = fixed.replace(/FROM\s+dbo\.([a-zA-Z0-9_]+)/gi, 'FROM dbo.$1 WITH (NOLOCK)');
  }
  
  // Ensure it uses GETDATE() for current date
  fixed = fixed.replace(/Date\(\)/gi, 'GETDATE()');
  
  // Ensure it uses DATEADD/DATEDIFF without quotes
  fixed = fixed.replace(/DateAdd\('([^']+)'/gi, "DATEADD($1");
  fixed = fixed.replace(/DateDiff\('([^']+)'/gi, "DATEDIFF($1");
  
  // Ensure it has 'value' as the alias
  if (fixed.includes('SELECT') && !fixed.includes(' as value') && !fixed.includes(' AS value')) {
    fixed = fixed.replace(/SELECT\s+([^,]+)(\s+FROM)/i, 'SELECT $1 as value$2');
  }
  
  return fixed;
}

// Function to fix POR SQL expressions (MS Access)
function fixPORSqlExpression(sql) {
  if (!sql) return sql;
  
  // Remove schema prefixes
  let fixed = sql.replace(/dbo\./g, '');
  
  // Remove WITH (NOLOCK) hints
  fixed = fixed.replace(/\s+WITH\s+\(NOLOCK\)/gi, '');
  
  // Ensure it uses Date() for current date
  fixed = fixed.replace(/GETDATE\(\)/gi, 'Date()');
  
  // Ensure it uses DateAdd/DateDiff with quotes
  fixed = fixed.replace(/DATEADD\(([a-z]+),/gi, "DateAdd('$1',");
  fixed = fixed.replace(/DATEDIFF\(([a-z]+),/gi, "DateDiff('$1',");
  
  // Ensure it has 'value' as the alias
  if (fixed.includes('SELECT') && !fixed.includes(' as value') && !fixed.includes(' AS value')) {
    fixed = fixed.replace(/SELECT\s+([^,]+)(\s+FROM)/i, 'SELECT $1 as value$2');
  }
  
  return fixed;
}

// Process each object
let fixedCount = 0;
const fixedObjects = objects.map(objectStr => {
  try {
    // Extract the ID to determine if it's P21 or POR
    const idMatch = objectStr.match(/"id"\s*:\s*"(\d+)"/);
    if (!idMatch) return objectStr;
    
    const id = parseInt(idMatch[1], 10);
    const isPOR = id >= 127 && id <= 174;
    
    // Extract the SQL expression
    const sqlMatch = objectStr.match(/"sqlExpression"\s*:\s*"([^"]*)"/);
    if (!sqlMatch) return objectStr;
    
    const originalSql = sqlMatch[1];
    
    // Fix the SQL expression based on database type
    const fixedSql = isPOR ? fixPORSqlExpression(originalSql) : fixP21SqlExpression(originalSql);
    
    // Only replace if there's a change
    if (fixedSql !== originalSql) {
      fixedCount++;
      logMessage(`Fixed SQL expression for ID ${id} (${isPOR ? 'POR' : 'P21'})`);
      return objectStr.replace(
        `"sqlExpression": "${originalSql}"`, 
        `"sqlExpression": "${fixedSql}"`
      );
    }
    
    return objectStr;
  } catch (error) {
    logMessage(`Error processing object: ${error.message}`);
    return objectStr;
  }
});

logMessage(`Fixed ${fixedCount} SQL expressions`);

// Reconstruct the file content
const newArrayContent = fixedObjects.join(',\n');
const newFileContent = beforeArray + newArrayContent + afterArray;

// Write the updated content back to the file
try {
  fs.writeFileSync(filePath, newFileContent);
  logMessage(`Successfully wrote updated content to ${filePath}`);
} catch (error) {
  logMessage(`Error writing file: ${error.message}`);
  process.exit(1);
}

logMessage('SQL expression fix completed successfully');
log.end();

