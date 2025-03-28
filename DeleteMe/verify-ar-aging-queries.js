// Script to verify AR Aging queries in the database
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Connect to the SQLite database
const db = new Database('./data/dashboard.db');

// Get the AR Aging queries from the database
console.log('Fetching AR Aging queries from the database...');
const rows = db.prepare(`
  SELECT id, chart_group, variable_name, server_name, db_table_name, 
         sql_expression, production_sql_expression, value
  FROM chart_data 
  WHERE chart_group = 'AR Aging'
  ORDER BY id
`).all();

console.log(`Found ${rows.length} AR Aging queries in the database`);

// Assign bucket names based on row order
const bucketNames = ['Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days'];

// Display the queries
console.log('\nAR Aging Queries in Database:');
rows.forEach((row, index) => {
  const bucketName = index < bucketNames.length ? bucketNames[index] : 'Unknown';
  console.log(`\n${bucketName} (${row.variable_name}):`);
  console.log(`ID: ${row.id}`);
  console.log(`Server: ${row.server_name}`);
  console.log(`Table: ${row.db_table_name}`);
  console.log(`SQL: ${row.sql_expression}`);
  console.log(`Production SQL: ${row.production_sql_expression}`);
  console.log(`Current Value: ${row.value}`);
});

// Close the database connection
db.close();

// Now check the initial-data.ts file
console.log('\nChecking AR Aging queries in initial-data.ts...');
const initialDataPath = path.join(__dirname, 'lib', 'db', 'initial-data.ts');
const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

// Function to extract a query from the initial-data.ts file
function extractQuery(content, id) {
  const idPattern = new RegExp(`id:\\s*["']${id}["']`);
  const idMatch = content.match(idPattern);
  if (!idMatch) {
    return null;
  }
  
  const rowStartPos = content.lastIndexOf('{', idMatch.index);
  if (rowStartPos === -1) {
    return null;
  }
  
  const rowEndPos = content.indexOf('}', idMatch.index);
  if (rowEndPos === -1) {
    return null;
  }
  
  return content.substring(rowStartPos, rowEndPos + 1);
}

// Check each AR Aging query in the initial-data.ts file
console.log('\nAR Aging Queries in initial-data.ts:');
rows.forEach((row, index) => {
  const bucketName = index < bucketNames.length ? bucketNames[index] : 'Unknown';
  const queryContent = extractQuery(initialDataContent, row.id);
  
  console.log(`\n${bucketName} (ID: ${row.id}):`);
  if (queryContent) {
    // Extract SQL expressions - check for both backtick and double quote formats
    let sqlMatch = queryContent.match(/sqlExpression:\s*`([^`]*)`/);
    if (!sqlMatch) {
      sqlMatch = queryContent.match(/sqlExpression:\s*"([^"]*)"/);
    }
    
    let prodSqlMatch = queryContent.match(/productionSqlExpression:\s*`([^`]*)`/);
    if (!prodSqlMatch) {
      prodSqlMatch = queryContent.match(/productionSqlExpression:\s*"([^"]*)"/);
    }
    
    const tableNameMatch = queryContent.match(/tableName:\s*["']([^"']*)["']/);
    
    console.log(`SQL: ${sqlMatch ? sqlMatch[1].trim() : 'Not found'}`);
    console.log(`Production SQL: ${prodSqlMatch ? prodSqlMatch[1].trim() : 'Not found'}`);
    console.log(`Table: ${tableNameMatch ? tableNameMatch[1] : 'Not found'}`);
  } else {
    console.log('Query not found in initial-data.ts');
  }
});
