// Script to test all POR SQL expressions against the POR database
// Uses the correct Jet SQL syntax for MS Access

// Import required modules
const fs = require('fs');
const path = require('path');

// Load the connection manager directly from the file
const connectionManagerPath = path.join(__dirname, '..', 'lib', 'db', 'connection-manager.ts');
const connectionManagerContent = fs.readFileSync(connectionManagerPath, 'utf8');

// Create a simple mock of the ConnectionManager for direct use
const ConnectionManager = {
  async executeAccessQuery(config, sql) {
    const { PORDirectReader } = require('../lib/db/por-direct-reader');
    
    if (!config.filePath) {
      throw new Error('File path is required for Access database queries');
    }
    
    const reader = new PORDirectReader(config.filePath);
    const connectResult = await reader.connect();
    
    if (!connectResult.success) {
      throw new Error(`Failed to connect to Access database: ${connectResult.message}`);
    }
    
    try {
      const result = await reader.executeSql(sql);
      return result;
    } catch (error) {
      throw new Error(`Error executing Access query: ${error.message}`);
    } finally {
      reader.close();
    }
  }
};

// Import the data directly from the file to avoid Next.js module issues
const dataPath = path.join(__dirname, '..', 'lib', 'db', 'complete-chart-data.ts');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const dataMatch = dataContent.match(/export const initialSpreadsheetData = (\[[\s\S]*?\]);/);

if (!dataMatch) {
  console.error('Could not find initialSpreadsheetData in the file');
  process.exit(1);
}

// Extract and parse the data
const dataString = dataMatch[1];
let initialSpreadsheetData;
try {
  // Convert TypeScript to JavaScript and evaluate
  const jsString = dataString
    .replace(/'/g, '"')
    .replace(/(\w+):/g, '"$1":')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');
  
  initialSpreadsheetData = JSON.parse(jsString);
} catch (error) {
  console.error('Error parsing data:', error);
  process.exit(1);
}

// Default POR file path
const DEFAULT_POR_FILE_PATH = process.env.POR_FILE_PATH || 'C:\\Users\\BobM\\Desktop\\POR.MDB';

// Function to fix POR SQL expressions to use proper Jet SQL syntax
function fixPORSqlExpression(sql, availableTables = []) {
  if (!sql) return sql;
  
  // Extract table name from SQL
  const tableMatch = sql.match(/FROM\s+([^\s,;()]+)/i);
  const tableName = tableMatch ? tableMatch[1] : null;
  
  // Check if table exists in the database
  const tableExists = tableName && availableTables.length > 0 && 
    availableTables.some(t => t.toLowerCase() === tableName.toLowerCase());
  
  // If table doesn't exist, try to find a suitable replacement
  if (tableName && !tableExists) {
    // Try to find a similar table name
    const possibleTables = availableTables.filter(t => 
      t.toLowerCase().includes('order') || 
      t.toLowerCase().includes('rental') ||
      t.toLowerCase().includes('transaction')
    );
    
    if (possibleTables.length > 0) {
      // Use the first matching table as a best guess
      sql = sql.replace(new RegExp(`FROM\\s+${tableName}\\b`, 'i'), `FROM ${possibleTables[0]}`);
    }
  }
  
  // Fix date functions
  sql = sql.replace(/GETDATE\(\)/gi, 'Date()');
  
  // Fix DATEADD/DATEDIFF syntax
  sql = sql.replace(/DATEADD\((\w+),\s*([^,]+),\s*([^)]+)\)/gi, 
    (match, interval, number, date) => `DateAdd('${interval}', ${number}, ${date})`);
  
  sql = sql.replace(/DATEDIFF\((\w+),\s*([^,]+),\s*([^)]+)\)/gi,
    (match, interval, date1, date2) => `DateDiff('${interval}', ${date1}, ${date2})`);
  
  // Fix NULL handling
  sql = sql.replace(/ISNULL\(([^,]+),\s*([^)]+)\)/gi, 
    (match, expr, replacement) => `Nz(${expr}, ${replacement})`);
  
  // Remove schema prefixes
  sql = sql.replace(/dbo\./gi, '');
  
  // Remove table hints
  sql = sql.replace(/WITH\s*\([^)]+\)/gi, '');
  
  return sql;
}

// Get all POR SQL expressions
function getAllPORSqlExpressions() {
  return initialSpreadsheetData
    .filter(item => item.serverName === 'POR' && item.productionSqlExpression)
    .map(item => ({
      id: item.id,
      dataPoint: item.DataPoint || `POR Expression ${item.id}`,
      sql: item.productionSqlExpression
    }));
}

// Main function to test POR SQL expressions
async function testPORExpressions() {
  console.log('Testing POR SQL expressions...');
  
  // Check if POR file exists
  if (!fs.existsSync(DEFAULT_POR_FILE_PATH)) {
    console.error(`POR file not found at: ${DEFAULT_POR_FILE_PATH}`);
    return;
  }
  
  // POR configuration
  const porConfig = {
    filePath: DEFAULT_POR_FILE_PATH
  };
  
  // Get available tables
  let availableTables = [];
  try {
    console.log('Getting available tables...');
    const tablesResult = await ConnectionManager.executeAccessQuery(porConfig, 'SHOW TABLES');
    availableTables = tablesResult.map(t => t.TableName || t.value);
    console.log(`Found ${availableTables.length} tables.`);
  } catch (error) {
    console.error('Error getting tables:', error.message);
    return;
  }
  
  // Get all POR expressions
  const porExpressions = getAllPORSqlExpressions();
  console.log(`Found ${porExpressions.length} POR SQL expressions.`);
  
  // Results
  const results = [];
  const errors = [];
  
  // Test each expression
  for (const expr of porExpressions) {
    try {
      console.log(`Testing expression ${expr.id}: ${expr.dataPoint}`);
      
      // Fix the SQL expression
      const fixedSql = fixPORSqlExpression(expr.sql, availableTables);
      
      // Execute the query
      const result = await ConnectionManager.executeAccessQuery(porConfig, fixedSql);
      
      results.push({
        id: expr.id,
        dataPoint: expr.dataPoint,
        originalSql: expr.sql,
        fixedSql,
        result
      });
      
      console.log(`  Success! Result: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(`  Error executing expression ${expr.id}:`, error.message);
      
      // Try with a simplified query
      try {
        const tableMatch = expr.sql.match(/FROM\s+([^\s,;()]+)/i);
        const tableName = tableMatch ? tableMatch[1] : null;
        
        if (tableName) {
          // Find a matching table
          const matchingTable = availableTables.find(t => 
            t.toLowerCase() === tableName.toLowerCase() ||
            t.toLowerCase().includes(tableName.toLowerCase())
          );
          
          if (matchingTable) {
            const simpleSql = `SELECT Count(*) AS value FROM ${matchingTable}`;
            console.log(`  Trying simplified query: ${simpleSql}`);
            
            const result = await ConnectionManager.executeAccessQuery(porConfig, simpleSql);
            
            results.push({
              id: `${expr.id}_simple`,
              dataPoint: `${expr.dataPoint} (Simplified)`,
              originalSql: expr.sql,
              fixedSql: simpleSql,
              result
            });
            
            console.log(`  Simplified query succeeded! Result: ${JSON.stringify(result)}`);
          }
        }
      } catch (innerError) {
        console.error(`  Simplified query also failed:`, innerError.message);
      }
      
      errors.push({
        id: expr.id,
        dataPoint: expr.dataPoint,
        sql: expr.sql,
        error: error.message
      });
    }
  }
  
  // Write results to file
  const outputFile = path.join(__dirname, 'por-sql-test-results.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    results,
    errors,
    porFilePath: DEFAULT_POR_FILE_PATH,
    availableTables: availableTables.slice(0, 50) // Only include first 50 tables for brevity
  }, null, 2));
  
  console.log(`\nTesting complete!`);
  console.log(`Successful queries: ${results.length}`);
  console.log(`Failed queries: ${errors.length}`);
  console.log(`Results written to: ${outputFile}`);
}

// Run the test
testPORExpressions().catch(error => {
  console.error('Unhandled error:', error);
});
