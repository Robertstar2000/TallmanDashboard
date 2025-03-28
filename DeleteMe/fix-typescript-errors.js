/**
 * Fix TypeScript Errors Script
 * This script:
 * 1. Reads the initial-data.ts file
 * 2. Fixes TypeScript errors by ensuring all objects match the SpreadsheetRow type
 * 3. Removes any undefined entries
 * 4. Fixes syntax errors
 * 5. Rewrites the file with correct syntax and types
 */

const fs = require('fs');
const path = require('path');

// Main function to fix TypeScript errors
async function fixTypeScriptErrors() {
  try {
    // Read the initial-data.ts file
    const initialDataPath = path.join(process.cwd(), 'lib', 'db', 'initial-data.ts');
    let fileContent = fs.readFileSync(initialDataPath, 'utf8');
    console.log('Successfully read initial-data.ts file');
    
    // Create a backup of the original file
    const backupPath = initialDataPath + '.backup-ts-' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`Created backup at ${backupPath}`);
    
    // Extract the type definition
    const typeDefStart = fileContent.indexOf('export type SpreadsheetRow');
    const typeDefEnd = fileContent.indexOf('};', typeDefStart) + 2;
    const typeDef = fileContent.substring(typeDefStart, typeDefEnd);
    console.log('Found SpreadsheetRow type definition');
    
    // Extract the file header (imports and type definitions)
    const headerEndIndex = fileContent.indexOf('export const initialSpreadsheetData: SpreadsheetRow[] = [');
    const header = fileContent.substring(0, headerEndIndex + 'export const initialSpreadsheetData: SpreadsheetRow[] = ['.length);
    
    // Extract the file footer (everything after the array)
    const footerStartIndex = fileContent.lastIndexOf('];');
    const footer = fileContent.substring(footerStartIndex);
    
    // Extract the array content
    const arrayContent = fileContent.substring(headerEndIndex + 'export const initialSpreadsheetData: SpreadsheetRow[] = ['.length, footerStartIndex);
    
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
        currentObject += char;
        if ((char === '"' || char === "'") && arrayContent[i-1] !== '\\') {
          inString = !inString;
        }
        continue;
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
          currentObject += char;
        }
      } else {
        currentObject += char;
      }
    }
    
    console.log(`Found ${objects.length} objects in the array`);
    
    // Parse each object to extract its properties
    const parsedObjects = [];
    
    for (const objStr of objects) {
      try {
        // Extract properties using regex
        const idMatch = objStr.match(/id:\s*['"]([^'"]+)['"]/);
        const nameMatch = objStr.match(/name:\s*["']([^"']+)["']/);
        const chartNameMatch = objStr.match(/chartName:\s*["']([^"']+)["']/);
        const variableNameMatch = objStr.match(/variableName:\s*["']([^"']+)["']/);
        const serverNameMatch = objStr.match(/serverName:\s*['"]([^'"]+)['"]/);
        const valueMatch = objStr.match(/value:\s*["']([^"']*)["']/);
        const chartGroupMatch = objStr.match(/chartGroup:\s*["']([^"']+)["']/);
        const calculationMatch = objStr.match(/calculation:\s*["']([^"']+)["']/);
        const sqlExpressionMatch = objStr.match(/sqlExpression:\s*["']([^"']+)["']/);
        const productionSqlExpressionMatch = objStr.match(/productionSqlExpression:\s*["']([^"']+)["']/);
        const tableNameMatch = objStr.match(/tableName:\s*["']([^"']+)["']/);
        const timeframeMatch = objStr.match(/timeframe:\s*["']([^"']+)["']/);
        
        // Check if this is a valid object with all required fields
        if (idMatch && nameMatch && chartNameMatch && variableNameMatch && 
            serverNameMatch && valueMatch !== null && chartGroupMatch && 
            calculationMatch && sqlExpressionMatch && productionSqlExpressionMatch && 
            tableNameMatch) {
          
          // Construct a clean object with all required fields
          const cleanObj = {
            id: idMatch[1],
            name: nameMatch[1],
            chartName: chartNameMatch[1],
            variableName: variableNameMatch[1],
            serverName: serverNameMatch[1],
            value: valueMatch ? valueMatch[1] : "0",
            chartGroup: chartGroupMatch[1],
            calculation: calculationMatch[1],
            sqlExpression: sqlExpressionMatch[1],
            productionSqlExpression: productionSqlExpressionMatch[1],
            tableName: tableNameMatch[1]
          };
          
          // Add optional timeframe if it exists
          if (timeframeMatch) {
            cleanObj.timeframe = timeframeMatch[1];
          }
          
          parsedObjects.push(cleanObj);
        } else {
          console.log(`Skipping invalid object: ${objStr.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error('Error parsing object:', objStr.substring(0, 50) + '...');
      }
    }
    
    console.log(`Successfully parsed ${parsedObjects.length} valid objects`);
    
    // Convert parsed objects back to string format
    const stringifiedObjects = parsedObjects.map(obj => {
      let result = '    {\n';
      
      // Add all required properties
      result += `      id: '${obj.id}',\n`;
      result += `      name: "${obj.name}",\n`;
      result += `      chartName: "${obj.chartName}",\n`;
      result += `      variableName: "${obj.variableName}",\n`;
      result += `      serverName: '${obj.serverName}',\n`;
      result += `      value: "${obj.value}",\n`;
      result += `      chartGroup: "${obj.chartGroup}",\n`;
      result += `      calculation: "${obj.calculation}",\n`;
      result += `      sqlExpression: "${obj.sqlExpression}",\n`;
      result += `      productionSqlExpression: "${obj.productionSqlExpression}",\n`;
      result += `      tableName: "${obj.tableName}"`;
      
      // Add optional timeframe if it exists
      if (obj.timeframe) {
        result += `,\n      timeframe: "${obj.timeframe}"`;
      }
      
      result += '\n    }';
      return result;
    });
    
    // Rebuild the file content with fixed objects
    const newArrayContent = stringifiedObjects.join(',\n');
    const newFileContent = header + '\n' + newArrayContent + '\n' + footer;
    
    // Write the updated file
    fs.writeFileSync(initialDataPath, newFileContent);
    console.log('\n✅ Successfully fixed TypeScript errors in the file');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the function
fixTypeScriptErrors();
