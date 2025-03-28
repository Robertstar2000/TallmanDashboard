// Script to update AR Aging queries in the initial-data.ts file
const fs = require('fs');
const path = require('path');

// Path to the initial-data.ts file
const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');

// Read the current initial-data.ts file
console.log('Reading initial-data.ts file...');
const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

// Define the improved AR Aging queries
const improvedQueries = [
  {
    id: '309',
    bucketName: 'Current',
    sql: `SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due = 0`,
    productionSql: `SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due = 0`
  },
  {
    id: '310',
    bucketName: '1-30 Days',
    sql: `SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due BETWEEN 1 AND 30`,
    productionSql: `SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due BETWEEN 1 AND 30`
  },
  {
    id: '311',
    bucketName: '31-60 Days',
    sql: `SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due BETWEEN 31 AND 60`,
    productionSql: `SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due BETWEEN 31 AND 60`
  },
  {
    id: '312',
    bucketName: '61-90 Days',
    sql: `SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due BETWEEN 61 AND 90`,
    productionSql: `SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due BETWEEN 61 AND 90`
  },
  {
    id: '313',
    bucketName: '90+ Days',
    sql: `SELECT SUM(open_amount) as value 
          FROM ar_open_items 
          WHERE days_past_due > 90`,
    productionSql: `SELECT SUM(open_amount) as value 
          FROM dbo.ar_open_items WITH (NOLOCK)
          WHERE days_past_due > 90`
  }
];

// Function to update a query in the initial-data.ts file
function updateQuery(content, id, sql, productionSql) {
  // Create regex patterns to match the query in the file
  const idPattern = new RegExp(`id:\\s*["']${id}["']`);
  
  // Find the position of the row with this ID
  const idMatch = content.match(idPattern);
  if (!idMatch) {
    console.log(`Row with ID ${id} not found in initial-data.ts`);
    return content;
  }
  
  // Find the start of the row (looking for { before the ID)
  const rowStartPos = content.lastIndexOf('{', idMatch.index);
  if (rowStartPos === -1) {
    console.log(`Could not find start of row for ID ${id}`);
    return content;
  }
  
  // Find the end of the row (looking for } after the ID)
  const rowEndPos = content.indexOf('}', idMatch.index);
  if (rowEndPos === -1) {
    console.log(`Could not find end of row for ID ${id}`);
    return content;
  }
  
  // Extract the row content
  const rowContent = content.substring(rowStartPos, rowEndPos + 1);
  
  // Create updated row with new SQL expressions
  let updatedRow = rowContent;
  
  // Update sqlExpression
  const sqlPattern = /sqlExpression:\s*["']([^"']*)["']/;
  if (sqlPattern.test(updatedRow)) {
    updatedRow = updatedRow.replace(sqlPattern, `sqlExpression: \`${sql}\``);
  } else {
    // If sqlExpression doesn't exist, add it before the closing brace
    updatedRow = updatedRow.replace(/}$/, `, sqlExpression: \`${sql}\` }`);
  }
  
  // Update productionSqlExpression
  const prodSqlPattern = /productionSqlExpression:\s*["']([^"']*)["']/;
  if (prodSqlPattern.test(updatedRow)) {
    updatedRow = updatedRow.replace(prodSqlPattern, `productionSqlExpression: \`${productionSql}\``);
  } else {
    // If productionSqlExpression doesn't exist, add it before the closing brace
    updatedRow = updatedRow.replace(/}$/, `, productionSqlExpression: \`${productionSql}\` }`);
  }
  
  // Update tableName if needed
  const tableNamePattern = /tableName:\s*["']([^"']*)["']/;
  if (!tableNamePattern.test(updatedRow)) {
    updatedRow = updatedRow.replace(/}$/, `, tableName: "ar_open_items" }`);
  } else if (updatedRow.match(tableNamePattern)[1] === '') {
    updatedRow = updatedRow.replace(tableNamePattern, `tableName: "ar_open_items"`);
  }
  
  // Replace the original row with the updated row
  return content.substring(0, rowStartPos) + updatedRow + content.substring(rowEndPos + 1);
}

// Update each query in the file
let updatedContent = initialDataContent;
for (const query of improvedQueries) {
  console.log(`Updating query for ${query.bucketName}...`);
  updatedContent = updateQuery(updatedContent, query.id, query.sql, query.productionSql);
}

// Write the updated content back to the file
console.log('Writing updated content to initial-data.ts...');
fs.writeFileSync(initialDataPath, updatedContent, 'utf8');

console.log('Successfully updated AR Aging queries in initial-data.ts');
