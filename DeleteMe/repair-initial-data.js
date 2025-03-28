/**
 * Repair Initial Data Script
 * This script:
 * 1. Fixes syntax errors in the initial-data.ts file
 * 2. Restores proper SQL expressions for accounts
 * 3. Ensures all chart groups have the correct structure
 */

const fs = require('fs');
const path = require('path');

// Account SQL expressions
const accountSqlExpressions = {
  'Payable': {
    'sqlExpression': "SELECT COALESCE(COUNT(*), 0) as value FROM accounts WHERE type = 'payable' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-$MONTH month')",
    'productionSqlExpression': "SELECT ISNULL(SUM(open_balance), 0) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE DATEADD(month, $MONTH, GETDATE()) > due_date"
  },
  'Overdue': {
    'sqlExpression': "SELECT COALESCE(COUNT(*), 0) as value FROM accounts WHERE type = 'overdue' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-$MONTH month')",
    'productionSqlExpression': "SELECT ISNULL(SUM(open_balance), 0) as value FROM dbo.ap_open_items WITH (NOLOCK) WHERE DATEADD(month, $MONTH, GETDATE()) > due_date AND GETDATE() > due_date"
  },
  'Receivable': {
    'sqlExpression': "SELECT COALESCE(COUNT(*), 0) as value FROM accounts WHERE type = 'receivable' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-$MONTH month')",
    'productionSqlExpression': "SELECT ISNULL(SUM(open_balance), 0) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE DATEADD(month, $MONTH, GETDATE()) > due_date"
  }
};

// Main function to repair the initial-data.ts file
async function repairInitialData() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-repair-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Extract the SpreadsheetRow type definition
    const typeDefStart = fileContent.indexOf('export type SpreadsheetRow');
    const typeDefEnd = fileContent.indexOf('export const initialSpreadsheetData');
    const typeDef = fileContent.substring(typeDefStart, typeDefEnd);
    
    // Extract the initialSpreadsheetData array declaration
    const arrayStart = fileContent.indexOf('export const initialSpreadsheetData: SpreadsheetRow[] = [');
    const arrayEnd = fileContent.indexOf('export const combinedData');
    
    if (arrayStart === -1 || arrayEnd === -1) {
      console.error('Could not find initialSpreadsheetData array in the file');
      return;
    }
    
    // Extract the array content
    const arrayDeclaration = 'export const initialSpreadsheetData: SpreadsheetRow[] = [';
    const arrayContent = fileContent.substring(arrayStart + arrayDeclaration.length, arrayEnd).trim();
    
    // Parse the array content to extract objects
    const objects = [];
    let currentObject = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < arrayContent.length; i++) {
      const char = arrayContent[i];
      
      if (escapeNext) {
        currentObject += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        currentObject += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"' || char === "'") {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            currentObject = '{';
          } else {
            currentObject += char;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          currentObject += char;
          
          if (braceCount === 0) {
            // End of object
            objects.push(currentObject.trim());
            currentObject = '';
          }
        } else {
          if (braceCount > 0 || char.trim() !== '') {
            currentObject += char;
          }
        }
      } else {
        currentObject += char;
      }
    }
    
    console.log(`Found ${objects.length} objects in the array`);
    
    // Parse each object to extract its properties
    const parsedObjects = objects.map(objStr => {
      try {
        // Extract properties using regex
        const idMatch = objStr.match(/id:\s*['"]([^'"]+)['"]/);
        const nameMatch = objStr.match(/name:\s*["']([^"']+)["']/);
        const chartNameMatch = objStr.match(/chartName:\s*["']([^"']+)["']/);
        const variableNameMatch = objStr.match(/variableName:\s*["']([^"']+)["']/);
        const serverNameMatch = objStr.match(/serverName:\s*['"]([^'"]+)['"]/);
        const valueMatch = objStr.match(/value:\s*["']([^"']+)["']/);
        const chartGroupMatch = objStr.match(/chartGroup:\s*["']([^"']+)["']/);
        const calculationMatch = objStr.match(/calculation:\s*["']([^"']+)["']/);
        
        return {
          id: idMatch ? idMatch[1] : '',
          name: nameMatch ? nameMatch[1] : '',
          chartName: chartNameMatch ? chartNameMatch[1] : '',
          variableName: variableNameMatch ? variableNameMatch[1] : '',
          serverName: serverNameMatch ? serverNameMatch[1] : 'P21',
          value: valueMatch ? valueMatch[1] : '0',
          chartGroup: chartGroupMatch ? chartGroupMatch[1] : '',
          calculation: calculationMatch ? calculationMatch[1] : 'COUNT(*)',
          original: objStr
        };
      } catch (error) {
        console.error('Error parsing object:', objStr);
        return {
          id: '',
          name: '',
          chartName: '',
          variableName: '',
          serverName: 'P21',
          value: '0',
          chartGroup: '',
          calculation: 'COUNT(*)',
          original: objStr
        };
      }
    });
    
    // Group objects by chart group
    const chartGroups = {};
    parsedObjects.forEach(obj => {
      const group = obj.chartGroup || 'Unknown';
      if (!chartGroups[group]) {
        chartGroups[group] = [];
      }
      chartGroups[group].push(obj);
    });
    
    // Print chart group statistics
    console.log('\nChart Group Statistics:');
    Object.entries(chartGroups).forEach(([group, objects]) => {
      console.log(`${group}: ${objects.length} rows`);
    });
    
    // Fix account rows
    const accountRows = parsedObjects.filter(obj => 
      obj.name.includes('Accounts - ') && 
      (obj.name.includes('Payable') || obj.name.includes('Overdue') || obj.name.includes('Receivable'))
    );
    
    console.log(`\nFound ${accountRows.length} account rows`);
    
    // Rebuild account objects with correct SQL expressions
    const fixedAccountObjects = accountRows.map(obj => {
      // Extract account type and month
      const nameMatch = obj.name.match(/Accounts - (Payable|Overdue|Receivable) - Month (\d+)/);
      if (!nameMatch) return obj.original;
      
      const accountType = nameMatch[1];
      const month = nameMatch[2];
      
      // Get the correct SQL expressions
      const sqlExpressions = accountSqlExpressions[accountType];
      if (!sqlExpressions) return obj.original;
      
      // Replace $MONTH placeholder with the actual month number
      const monthOffset = parseInt(month) - 1;
      const sqlExpression = sqlExpressions.sqlExpression.replace('$MONTH', monthOffset);
      const productionSqlExpression = sqlExpressions.productionSqlExpression.replace('$MONTH', monthOffset);
      
      // Create the fixed object
      return `    {
      id: '${obj.id}',
      name: "${obj.name}",
      chartName: "${obj.chartName}",
      variableName: "${obj.variableName}",
      serverName: "${obj.serverName}",
      value: "${obj.value}",
      chartGroup: "Accounts",
      calculation: "${obj.calculation}",
      timeframe: "Month ${month}",
      sqlExpression: "${sqlExpression}",
      productionSqlExpression: "${productionSqlExpression}",
      tableName: "${accountType === 'Receivable' ? 'ar_open_items' : 'ap_open_items'}"
    }`;
    });
    
    // Rebuild the file content
    const beforeArray = fileContent.substring(0, arrayStart);
    const afterArray = fileContent.substring(arrayEnd);
    
    // Get all non-account objects
    const nonAccountObjects = parsedObjects
      .filter(obj => !(obj.name.includes('Accounts - ') && 
                      (obj.name.includes('Payable') || obj.name.includes('Overdue') || obj.name.includes('Receivable'))))
      .map(obj => obj.original);
    
    // Combine all objects
    const allObjects = [...nonAccountObjects, ...fixedAccountObjects];
    
    // Rebuild the array with proper formatting
    const formattedArray = allObjects.join(',\n');
    
    // Rebuild the file content
    const newFileContent = 
      beforeArray + 
      arrayDeclaration + 
      '\n' + formattedArray + '\n  ' + 
      afterArray;
    
    // Write the fixed content to the file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully repaired the initial-data.ts file');
    
    // Verify the changes
    const accountCount = fixedAccountObjects.length;
    console.log(`\nVerified ${accountCount} account rows with fixed SQL expressions`);
    
    if (accountCount === 36) {
      console.log('All 36 account rows have been properly fixed');
    } else {
      console.error(`Expected 36 account rows, but found ${accountCount}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
repairInitialData();
