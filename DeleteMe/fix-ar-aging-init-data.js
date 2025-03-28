// Script to fix AR Aging queries in the initial-data.ts file
const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the current initial-data.ts file
console.log('Reading initial-data.ts file...');
let initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

// Define the improved AR Aging queries with proper escaping
const improvedQueries = [
  {
    id: '309',
    bucketName: 'Current',
    sql: 'SELECT SUM(open_amount) as value FROM ar_open_items WHERE days_past_due = 0',
    productionSql: 'SELECT SUM(open_amount) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due = 0'
  },
  {
    id: '310',
    bucketName: '1-30 Days',
    sql: 'SELECT SUM(open_amount) as value FROM ar_open_items WHERE days_past_due BETWEEN 1 AND 30',
    productionSql: 'SELECT SUM(open_amount) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due BETWEEN 1 AND 30'
  },
  {
    id: '311',
    bucketName: '31-60 Days',
    sql: 'SELECT SUM(open_amount) as value FROM ar_open_items WHERE days_past_due BETWEEN 31 AND 60',
    productionSql: 'SELECT SUM(open_amount) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due BETWEEN 31 AND 60'
  },
  {
    id: '312',
    bucketName: '61-90 Days',
    sql: 'SELECT SUM(open_amount) as value FROM ar_open_items WHERE days_past_due BETWEEN 61 AND 90',
    productionSql: 'SELECT SUM(open_amount) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due BETWEEN 61 AND 90'
  },
  {
    id: '313',
    bucketName: '90+ Days',
    sql: 'SELECT SUM(open_amount) as value FROM ar_open_items WHERE days_past_due > 90',
    productionSql: 'SELECT SUM(open_amount) as value FROM dbo.ar_open_items WITH (NOLOCK) WHERE days_past_due > 90'
  }
];

// Process each query
for (const query of improvedQueries) {
  console.log(`Processing query for ${query.bucketName}...`);
  
  // Create regex patterns to find the specific row by ID
  const idRegex = new RegExp(`id:\\s*["']${query.id}["']`, 'g');
  
  // Find all occurrences of the ID
  let match;
  let positions = [];
  while ((match = idRegex.exec(initialDataContent)) !== null) {
    positions.push(match.index);
  }
  
  if (positions.length === 0) {
    console.log(`Could not find row with ID ${query.id}`);
    continue;
  }
  
  // Process each occurrence (should be just one, but just in case)
  for (const position of positions) {
    // Find the start of the object containing this ID
    let braceCount = 0;
    let startPos = position;
    while (startPos >= 0) {
      if (initialDataContent[startPos] === '{') {
        braceCount++;
        if (braceCount > 0) break;
      } else if (initialDataContent[startPos] === '}') {
        braceCount--;
      }
      startPos--;
    }
    
    // Find the end of the object
    braceCount = 1; // We start after the opening brace
    let endPos = startPos + 1;
    while (endPos < initialDataContent.length && braceCount > 0) {
      if (initialDataContent[endPos] === '{') {
        braceCount++;
      } else if (initialDataContent[endPos] === '}') {
        braceCount--;
      }
      endPos++;
    }
    
    if (braceCount !== 0) {
      console.log(`Could not find matching braces for ID ${query.id}`);
      continue;
    }
    
    // Extract the object
    const obj = initialDataContent.substring(startPos, endPos);
    
    // Check if the object contains sqlExpression and productionSqlExpression
    const hasSqlExpr = obj.includes('sqlExpression');
    const hasProdSqlExpr = obj.includes('productionSqlExpression');
    
    // Create the updated object
    let updatedObj = obj;
    
    // Update sqlExpression
    if (hasSqlExpr) {
      updatedObj = updatedObj.replace(
        /sqlExpression:\s*["'`]([^"'`]*)["'`]/g,
        `sqlExpression: "${query.sql}"`
      );
    } else {
      // Add sqlExpression before the closing brace
      updatedObj = updatedObj.replace(
        /}\s*$/,
        `, sqlExpression: "${query.sql}" }`
      );
    }
    
    // Update productionSqlExpression
    if (hasProdSqlExpr) {
      updatedObj = updatedObj.replace(
        /productionSqlExpression:\s*["'`]([^"'`]*)["'`]/g,
        `productionSqlExpression: "${query.productionSql}"`
      );
    } else {
      // Add productionSqlExpression before the closing brace
      updatedObj = updatedObj.replace(
        /}\s*$/,
        `, productionSqlExpression: "${query.productionSql}" }`
      );
    }
    
    // Update tableName if it's empty or missing
    if (!obj.includes('tableName')) {
      updatedObj = updatedObj.replace(
        /}\s*$/,
        `, tableName: "ar_open_items" }`
      );
    } else {
      updatedObj = updatedObj.replace(
        /tableName:\s*["']([^"']*)["']/g,
        `tableName: "ar_open_items"`
      );
    }
    
    // Replace the original object with the updated one
    initialDataContent = initialDataContent.substring(0, startPos) + 
                         updatedObj + 
                         initialDataContent.substring(endPos);
  }
}

// Write the updated content back to the file
console.log('Writing updated content to initial-data.ts...');
fs.writeFileSync(initialDataPath, initialDataContent, 'utf8');

console.log('Successfully updated AR Aging queries in initial-data.ts');
