// JavaScript script to fix the POR SQL expressions in complete-chart-data.ts
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const backupPath = path.join(__dirname, '..', 'lib', 'db', `complete-chart-data.ts.backup-js-${new Date().toISOString().replace(/:/g, '-')}`);

console.log(`Starting POR SQL expression fix at ${new Date().toISOString()}`);

// Create a backup of the current file
fs.copyFileSync(filePath, backupPath);
console.log(`Created backup at ${backupPath}`);

// Read the file content
let fileContent = fs.readFileSync(filePath, 'utf8');

// Function to fix multiline SQL expressions
function fixMultilineSql(content) {
    // Split the content into lines
    const lines = content.split(/\r?\n/);
    
    // Initialize variables
    let inPorEntry = false;
    let inSqlExpression = false;
    let sqlStartIndex = -1;
    let sqlEndIndex = -1;
    let porCount = 0;
    let fixedCount = 0;
    
    // Process each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if we're starting a new entry
        if (line.trim().startsWith('{')) {
            inPorEntry = false;
            inSqlExpression = false;
        }
        
        // Check if this is a POR entry
        if (line.includes('"serverName": "POR"')) {
            inPorEntry = true;
            porCount++;
        }
        
        // Check if we're starting a SQL expression in a POR entry
        if (inPorEntry && line.includes('"sqlExpression":')) {
            inSqlExpression = true;
            sqlStartIndex = i;
            
            // Check if the SQL expression is multiline (doesn't end with ")
            const trimmedLine = line.trim();
            if (!trimmedLine.endsWith('"') && !trimmedLine.endsWith('",')) {
                // Find the end of the SQL expression
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].includes('"')) {
                        sqlEndIndex = j;
                        break;
                    }
                }
                
                // If we found the end of the SQL expression
                if (sqlEndIndex > sqlStartIndex) {
                    fixedCount++;
                    
                    // Extract the SQL expression
                    let sqlExpression = lines[sqlStartIndex];
                    for (let j = sqlStartIndex + 1; j <= sqlEndIndex; j++) {
                        sqlExpression += ' ' + lines[j].trim();
                    }
                    
                    // Replace the original multiline SQL expression with the fixed one
                    lines[sqlStartIndex] = sqlExpression;
                    
                    // Remove the lines that were part of the multiline SQL expression
                    lines.splice(sqlStartIndex + 1, sqlEndIndex - sqlStartIndex);
                    
                    // Adjust the index to account for the removed lines
                    i = sqlStartIndex;
                    
                    console.log(`Fixed multiline SQL expression in POR entry #${porCount}`);
                }
            }
        }
    }
    
    console.log(`\nVerification:`);
    console.log(`POR entries found: ${porCount}`);
    console.log(`POR entries with multiline SQL fixed: ${fixedCount}`);
    
    return lines.join('\n');
}

// Fix the multiline SQL expressions
const fixedContent = fixMultilineSql(fileContent);

// Write the updated content back to the file
fs.writeFileSync(filePath, fixedContent);

console.log(`\nPOR SQL expression formatting completed at ${new Date().toISOString()}!`);

